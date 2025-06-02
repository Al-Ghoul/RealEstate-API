import { env } from "./config/env.config";
import jwt from "jsonwebtoken";
import { logger } from "./utils/logger.utils";
import L from "./i18n/i18n-node";
import type { Locales } from "./i18n/i18n-types";

type SocketData = {
  token: string | null;
  lang: Locales;
  user?: Pick<User, "id">;
};

type MessagePayload =
  | { type: "send_message"; data: { chatId: string; content: string } }
  | { type: "typing"; data: { chatId: string } }
  | { type: "read"; data: { chatId: string; messageId: string } };

type ServerMessage =
  | {
      type: "new_message";
      data: {
        chatId: string;
        senderId: string;
        content: string;
        createdAt: Date;
      };
    }
  | { type: "typing"; data: { chatId: string; userId: string } }
  | {
      type: "read_receipt";
      data: { chatId: string; userId: string; messageId: string };
    };

export default function wsServer() {
  return Bun.serve<SocketData, object>({
    port: env.PORT + 1,
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
      open(ws) {
        const { token, lang: lang } = ws.data;
        if (!token) {
          ws.close(1008, L[lang].MISSING_AUTHORIZATION_TOKEN());
          return;
        }

        const { header, payload } = jwt.verify(token, env.JWT_SECRET, {
          issuer: env.TOKEN_ISSUER,
          audience: env.TOKEN_AUDIENCE,
          complete: true,
        });
        const { kid } = header;
        const { sub, token_type } = payload as jwt.JwtPayload;

        if (token_type !== "access" || !sub || !kid) {
          logger.warn({
            message: "Invalid Token",
            info: {
              // requestId: req.id,
              userId: sub,
              ip: ws.remoteAddress,
            },
          });
          ws.close(1008, L[lang].INVALID_ACCESS_TOKEN());
          return;
        }

        ws.data.user = {
          id: sub,
        };
      },

      async close(_ws, _code, _message) {},

      message(ws, message) {
        const user = ws.data.user;
        if (!user) return;

        let msg: MessagePayload;
        try {
          msg = JSON.parse(message.toString()) as MessagePayload;
        } catch {
          console.warn("Invalid JSON");
          return;
        }

        const userId = user.id;

        switch (msg.type) {
          case "send_message": {
            const { chatId, content } = msg.data;

            const outgoing: ServerMessage = {
              type: "new_message",
              data: {
                chatId,
                senderId: userId,
                content,
                createdAt: new Date(),
              },
            };

            if (!ws.isSubscribed(chatId)) {
              ws.subscribe(chatId);
            }
            ws.publish(chatId, JSON.stringify(outgoing));
            break;
          }

          case "typing": {
            const { chatId } = msg.data;

            const outgoing: ServerMessage = {
              type: "typing",
              data: { chatId, userId },
            };

            ws.subscribe(chatId);
            ws.publish(chatId, JSON.stringify(outgoing));
            break;
          }

          case "read": {
            const { chatId, messageId } = msg.data;

            const outgoing: ServerMessage = {
              type: "read_receipt",
              data: { chatId, userId, messageId },
            };

            ws.subscribe(chatId);
            ws.publish(chatId, JSON.stringify(outgoing));
            break;
          }
        }
      },

      async drain(_ws) {},
    },
  });
}
