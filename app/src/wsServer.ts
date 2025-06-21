import { env } from "./config/env.config";
import jwt from "jsonwebtoken";
import { logger } from "./utils/logger.utils";
import L from "./i18n/i18n-node";
import type { Locales } from "./i18n/i18n-types";
import { db } from "./db";
import {
  message as messageTable,
  chatParticipant,
} from "./db/schemas/chat.schema";
import { and, eq, sql } from "drizzle-orm";
import { first } from "lodash-es";
import {
  ensureChatExists,
  ensureParticipant,
  getMessageByIdAndChatId,
} from "./services/chat.service";

type SocketData = {
  token: string | null;
  lang: Locales;
  user?: Pick<User, "id"> & Pick<Profile, "firstName" | "lastName">;
};

type MessagePayload =
  | {
      type: "message:send";
      data: {
        tempId: string;
        chatId: string;
        content: string;
        replyToId?: string;
      };
    }
  | { type: "typing"; data: { chatId: string } }
  | { type: "message:read"; data: { chatId: string; messageId: string } }
  | {
      type: "chat:delete";
      data: {
        chatId: string;
        deleteForBoth?: boolean;
      };
    }
  | {
      type: "message:delete";
      data: {
        chatId: string;
        messageId: string;
        deleteForBoth?: boolean;
      };
    };

type ServerMessage =
  | {
      type: "message:new";
      data: {
        _tempId?: string;
        chatId: string;
        senderId: string;
        senderFullName: string;
        recipentFullName: string;
        content: string;
        createdAt: Date;
        serverId: string;
        replyToId?: string;
        replyTo?: {
          id: string;
          senderId: string;
          content: string;
          createdAt: Date;
        };
      };
    }
  | { type: "typing"; data: { chatId: string; userId: string } }
  | {
      type: "message:read";
      data: { chatId: string; userId: string; messageId: string };
    }
  | { type: "message:failed"; data: { _tempId: string; chatId: string } }
  | {
      type: "chat:deleted";
      data: {
        chatId: string;
        deletedBy: string;
        deletedForBoth: boolean;
      };
    }
  | {
      type: "message:deleted";
      data: {
        chatId: string;
        messageId: string;
      };
    };

const userConnections = new Map<string, Set<Bun.ServerWebSocket<SocketData>>>();

function addUserConnection(
  userId: string,
  ws: Bun.ServerWebSocket<SocketData>,
) {
  if (!userConnections.has(userId)) userConnections.set(userId, new Set());
  userConnections.get(userId)?.add(ws);
}

function removeUserConnection(
  userId: string,
  ws: Bun.ServerWebSocket<SocketData>,
) {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }
}

const messageQueues = new WeakMap<Bun.ServerWebSocket<SocketData>, string[]>();

function enqueue(ws: Bun.ServerWebSocket<SocketData>, message: string) {
  let queue = messageQueues.get(ws);
  if (!queue) {
    queue = [];
    messageQueues.set(ws, queue);
  }

  if (queue.length > 100) queue.shift();

  queue.push(message);
}
function flush(ws: Bun.ServerWebSocket<SocketData>) {
  const queue = messageQueues.get(ws);
  if (!queue || queue.length === 0) return;

  while (queue.length > 0) {
    const message = queue[0];
    const result = ws.send(message);
    if (result === -1) {
      break;
    } else if (result === 0) {
      queue.shift();
    } else {
      queue.shift();
    }
  }

  if (queue.length === 0) {
    messageQueues.delete(ws);
  }
}

function sendMessage(ws: Bun.ServerWebSocket<SocketData>, message: unknown) {
  const data = typeof message === "string" ? message : JSON.stringify(message);
  const result = ws.send(data);

  if (result > 0) return;

  if (result === -1) enqueue(ws, data);
}

const server = Bun.serve<SocketData, object>({
  port: env.WS_PORT,
  development: env.NODE_ENV === "development",
  fetch(req, server) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const lang = (url.searchParams.get("lang") ||
      req.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ||
      "en") as Locales;

    const success = server.upgrade(req, {
      data: {
        token,
        lang,
      },
    });

    return success
      ? undefined
      : new Response("Upgrade failed", { status: 400 });
  },
  websocket: {
    backpressureLimit: 1 * 1024 * 1024,

    open(ws) {
      const { token, lang: lang } = ws.data;
      if (!token) {
        ws.close(1008, L[lang].MISSING_AUTHORIZATION_TOKEN());
        return;
      }

      try {
        const { header, payload } = jwt.verify(token, env.JWT_SECRET, {
          issuer: env.TOKEN_ISSUER,
          audience: env.TOKEN_AUDIENCE,
          complete: true,
        });
        const { kid } = header;
        const { sub, token_type, firstName, lastName } =
          payload as jwt.JwtPayload;

        if (token_type !== "access" || !sub || !kid) {
          logger.warn({
            message: "Invalid Token",
            info: {
              userId: sub,
              ip: ws.remoteAddress,
            },
          });
          ws.close(1008, L[lang].INVALID_ACCESS_TOKEN());
          return;
        }

        ws.subscribe(`user:${sub}`);
        addUserConnection(sub, ws);

        ws.data.user = {
          id: sub,
          firstName,
          lastName,
        };
      } catch (e) {
        logger.warn({
          message: "Invalid Token",
          info: {
            ip: ws.remoteAddress,
            error: e,
          },
        });
        ws.close(1008, L[lang].MISSING_AUTHORIZATION_TOKEN());
      }
    },

    close(ws, _code, _message) {
      const { user } = ws.data;
      if (user) {
        removeUserConnection(user.id, ws);

        logger.info({
          message: "WebSocket connection closed",
          info: {
            userId: user.id,
          },
        });
      }
    },

    async message(ws, message) {
      const user = ws.data.user;
      if (!user) return;

      let msg: MessagePayload;
      try {
        msg = JSON.parse(message.toString()) as MessagePayload;
      } catch (error) {
        logger.warn({
          message: "Invalid message",
          info: {
            userId: user.id,
            error: error,
            stack: error instanceof Error ? error.stack : undefined,
            ip: ws.remoteAddress,
          },
        });
        return;
      }

      const currentUserId = user.id;

      switch (msg.type) {
        case "message:send": {
          const { chatId, tempId, content, replyToId } = msg.data;
          try {
            await ensureChatExists(chatId);
            if (!(await ensureParticipant(chatId, currentUserId))) return;

            await db.transaction(async (tx) => {
              const savedMessage = first(
                await tx
                  .insert(messageTable)
                  .values({
                    chatId,
                    senderId: currentUserId,
                    content,
                    replyToId,
                  })
                  .returning(),
              );

              if (!savedMessage) throw new Error("Insert failed");

              const participantIds = chatId.split("_");
              if (participantIds.length !== 2)
                throw new Error("Invalid chatId");
              const otherUserId = participantIds.find(
                (id) => id !== currentUserId,
              );
              if (!otherUserId) throw new Error("Other user not found");

              let replyMessage: ChatMessage | undefined = undefined;
              if (replyToId)
                replyMessage = await getMessageByIdAndChatId(replyToId, chatId);

              const otherUserConnections = userConnections.get(otherUserId);
              const otherUserInfo = otherUserConnections?.values().next().value
                ?.data;

              const outgoing: ServerMessage = {
                type: "message:new",
                data: {
                  _tempId: tempId,
                  chatId,
                  senderId: currentUserId,
                  senderFullName: `${user.firstName ?? ""} ${
                    user.lastName ?? ""
                  }`,
                  recipentFullName: `${otherUserInfo?.user?.firstName ?? ""} ${
                    otherUserInfo?.user?.lastName ?? ""
                  }`,
                  content,
                  createdAt: savedMessage.createdAt,
                  serverId: savedMessage.id,
                  replyToId,
                  replyTo: replyToId
                    ? {
                        id: replyToId,
                        content: replyMessage?.content ?? "",
                        senderId: replyMessage?.senderId ?? "",
                        createdAt: replyMessage?.createdAt ?? new Date(),
                      }
                    : undefined,
                },
              };

              const currentUserConnections = userConnections.get(currentUserId);
              const allConnections = [
                ...(currentUserConnections ?? []),
                ...(otherUserConnections ?? []),
              ];

              for (const connection of allConnections) {
                if (!connection.isSubscribed(chatId))
                  connection.subscribe(chatId);
              }

              server.publish(chatId, JSON.stringify(outgoing));
            });
          } catch (error) {
            logger.error({
              message: "Failed to send message",
              info: {
                userId: user.id,
                ip: ws.remoteAddress,
                error,
                stack: error instanceof Error ? error.stack : undefined,
              },
            });
            const outgoing: ServerMessage = {
              type: "message:failed",
              data: { _tempId: tempId, chatId },
            };
            sendMessage(ws, JSON.stringify(outgoing));
          }
          break;
        }

        case "typing": {
          const { chatId } = msg.data;
          try {
            await ensureChatExists(chatId);
            if (!(await ensureParticipant(chatId, currentUserId))) return;

            const participantIds = chatId.split("_");
            if (participantIds.length !== 2) throw new Error("Invalid chatId");
            const otherUserId = participantIds.find(
              (id) => id !== currentUserId,
            );
            if (!otherUserId) throw new Error("Other user not found");

            const otherUserConnections = userConnections.get(otherUserId);
            if (!otherUserConnections) return;

            for (const connection of otherUserConnections) {
              if (!connection.isSubscribed(chatId))
                connection.subscribe(chatId);
            }

            const outgoing: ServerMessage = {
              type: "typing",
              data: { chatId, userId: currentUserId },
            };

            if (!ws.isSubscribed(chatId)) ws.subscribe(chatId);
            ws.publish(chatId, JSON.stringify(outgoing));
          } catch (error) {
            logger.error({
              message: "Failed to send typing",
              info: {
                userId: currentUserId,
                chatId,
                error,
                stack: error instanceof Error ? error.stack : undefined,
              },
            });
          }
          break;
        }

        case "message:read": {
          const { chatId, messageId } = msg.data;
          try {
            if (!(await ensureParticipant(chatId, currentUserId))) return;
            await db.transaction(async (tx) => {
              await tx
                .update(chatParticipant)
                .set({ lastReadMessageId: messageId })
                .where(
                  and(
                    eq(chatParticipant.chatId, chatId),
                    eq(chatParticipant.userId, currentUserId),
                  ),
                );
            });

            const outgoing: ServerMessage = {
              type: "message:read",
              data: { chatId, userId: currentUserId, messageId },
            };

            if (!ws.isSubscribed(chatId)) ws.subscribe(chatId);
            ws.publish(chatId, JSON.stringify(outgoing));
          } catch (error) {
            logger.error({
              message: "Failed to update read message",
              info: {
                userId: currentUserId,
                chatId,
                messageId,
                error,
                stack: error instanceof Error ? error.stack : undefined,
              },
            });
          }
          break;
        }

        case "chat:delete": {
          const { chatId, deleteForBoth = false } = msg.data;
          try {
            if (!(await ensureParticipant(chatId, currentUserId))) return;

            const participantIds = chatId.split("_");
            if (participantIds.length !== 2) throw new Error("Invalid chatId");
            const otherUserId = participantIds.find(
              (id) => id !== currentUserId,
            );
            if (!otherUserId) throw new Error("Other user not found");

            const otherUserConnections = userConnections.get(otherUserId);
            if (!otherUserConnections) return;

            for (const connection of otherUserConnections) {
              if (!connection.isSubscribed(chatId))
                connection.subscribe(chatId);
            }

            if (!ws.isSubscribed(chatId)) ws.subscribe(chatId);

            await db.transaction(async (tx) => {
              if (deleteForBoth) {
                await tx.execute(
                  sql`UPDATE chat SET deleted_at = NOW() WHERE id = ${chatId}`,
                );

                server.publish(
                  chatId,
                  JSON.stringify({
                    type: "chat:deleted",
                    data: {
                      chatId,
                      deletedBy: currentUserId,
                      deletedForBoth: true,
                    },
                  }),
                );

                logger.info({
                  message: "Chat deleted for both participants",
                  info: {
                    chatId,
                    deletedBy: currentUserId,
                    ip: ws.remoteAddress,
                  },
                });
              } else {
                await tx
                  .update(chatParticipant)
                  .set({ leftAt: new Date() })
                  .where(
                    and(
                      eq(chatParticipant.chatId, chatId),
                      eq(chatParticipant.userId, currentUserId),
                    ),
                  );

                sendMessage(
                  ws,
                  JSON.stringify({
                    type: "chat:deleted",
                    data: {
                      chatId,
                      deletedBy: currentUserId,
                      deletedForBoth: false,
                    },
                  }),
                );

                logger.info({
                  message: "Chat deleted for individual user",
                  info: {
                    chatId,
                    deletedBy: currentUserId,
                    ip: ws.remoteAddress,
                  },
                });
              }
            });
          } catch (error) {
            logger.error({
              message: "Failed to delete chat",
              info: {
                userId: user.id,
                chatId,
                deleteForBoth,
                ip: ws.remoteAddress,
                error,
                stack: error instanceof Error ? error.stack : undefined,
              },
            });
          }
          break;
        }

        case "message:delete": {
          const { chatId, messageId, deleteForBoth = false } = msg.data;
          if (!(await ensureParticipant(chatId, currentUserId))) return;

          try {
            await db.transaction(async (tx) => {
              if (deleteForBoth) {
                await tx
                  .update(messageTable)
                  .set({ deletedAt: new Date(), deletedForId: null })
                  .where(
                    and(
                      eq(messageTable.id, messageId),
                      eq(messageTable.chatId, chatId),
                    ),
                  );

                server.publish(
                  chatId,
                  JSON.stringify({
                    type: "message:deleted",
                    data: { chatId, messageId },
                  }),
                );
              } else {
                await tx
                  .update(messageTable)
                  .set({ deletedAt: new Date(), deletedForId: currentUserId })
                  .where(
                    and(
                      eq(messageTable.id, messageId),
                      eq(messageTable.chatId, chatId),
                    ),
                  );

                sendMessage(
                  ws,
                  JSON.stringify({
                    type: "message:deleted",
                    data: { chatId, messageId },
                  }),
                );
              }
            });
            logger.info({
              message: "Message deleted",
              info: {
                userId: currentUserId,
                chatId,
                messageId,
                deleteForBoth,
              },
            });
          } catch (error) {
            logger.error({
              message: "Failed to delete message",
              info: {
                userId: currentUserId,
                chatId,
                messageId,
                error,
                stack: error instanceof Error ? error.stack : undefined,
              },
            });
          }
          break;
        }
      }
    },

    drain(ws) {
      flush(ws);
    },
  },
});
