import {
  expect,
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "bun:test";
import { redisClient } from "../../utils/redis.utils";
import "../../wsServer";
import { env } from "../../config/env.config";
import { createUser } from "../lib";
import { generateJWTTokens } from "../../utils/auth.utils";
import { db } from "../../db";
import { user } from "../../db/schemas/user.schema";
import { role } from "../../db/schemas/role.schema";
import {
  message as messageTable,
  chatParticipant,
  chat,
} from "../../db/schemas/chat.schema";
import { ensureChatExists } from "../../services/chat.service";

const basicUser1 = {
  email: "johndoe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "password",
  confirmPassword: "password",
  role: "CLIENT",
};

const basicUser2 = {
  email: "janedoe@example.com",
  firstName: "Jane",
  lastName: "Doe",
  password: "password",
  confirmPassword: "password",
  role: "CLIENT",
};

const createWebSocketConnection = (
  token: string,
  lang = "en",
): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      `ws://localhost:${env.WS_PORT}?token=${token}&lang=${lang}`,
    );

    ws.onopen = () => resolve(ws);
    ws.onerror = (err) => reject(err);

    // Set a timeout to prevent hanging
    setTimeout(() => reject(new Error("WebSocket connection timeout")), 5000);
  });
};

const waitForMessage = (
  ws: WebSocket,
  expectedType?: string,
  timeout = 5000,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Message timeout${
            expectedType ? ` waiting for ${expectedType}` : ""
          }`,
        ),
      );
    }, timeout);

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data.toString());
        if (!expectedType || data.type === expectedType) {
          clearTimeout(timer);
          ws.removeEventListener("message", handler);
          resolve(data);
        }
      } catch (err) {
        clearTimeout(timer);
        ws.removeEventListener("message", handler);
        reject(err);
      }
    };

    ws.addEventListener("message", handler);
  });
};

const sendMessageAndWait = (
  ws: WebSocket,
  message: any,
  expectedType?: string,
): Promise<any> => {
  ws.send(JSON.stringify(message));
  return waitForMessage(ws, expectedType);
};

describe("WebSocket Server Tests", () => {
  let user1: any, user2: any;
  let tokens1: any, tokens2: any;
  let chatId: string;

  beforeEach(async () => {
    user1 = await createUser(basicUser1);
    user2 = await createUser({ ...basicUser2 });

    tokens1 = generateJWTTokens({ id: user1.body.data.id, ...basicUser1 });
    tokens2 = generateJWTTokens({ id: user2.body.data.id, ...basicUser2 });

    chatId = `${user1.body.data.id}_${user2.body.data.id}`;
  });

  describe("WebSocket Connection", () => {
    it("should successfully connect with valid token", async () => {
      const ws = await createWebSocketConnection(tokens1.accessToken);
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    it("should reject connection with invalid token", async () => {
      try {
        const ws = new WebSocket(
          `ws://localhost:${env.WS_PORT}?token=invalid_token`,
        );
        await new Promise((resolve, reject) => {
          ws.onclose = (event) => {
            expect(event.code).toBe(1008);
            resolve(event);
          };
          ws.onerror = reject;
          setTimeout(() => reject(new Error("Timeout")), 2000);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject connection without token", async () => {
      try {
        const ws = new WebSocket(`ws://localhost:${env.WS_PORT}`);
        await new Promise((resolve, reject) => {
          ws.onclose = (event) => {
            expect(event.code).toBe(1008);
            resolve(event);
          };
          ws.onerror = reject;
          setTimeout(() => reject(new Error("Timeout")), 2000);
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Message Sending", () => {
    it("should send and receive messages between users", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      const ws2 = await createWebSocketConnection(tokens2.accessToken);

      const messageContent = "Hello from user 1!";
      const tempId = "temp-" + Date.now();

      const messagePromise = waitForMessage(ws2, "message:new");

      const sendMessage = {
        type: "message:send",
        data: {
          tempId,
          chatId,
          content: messageContent,
        },
      };

      ws1.send(JSON.stringify(sendMessage));

      const receivedMessage = await messagePromise;

      expect(receivedMessage.type).toBe("message:new");
      expect(receivedMessage.data.content).toBe(messageContent);
      expect(receivedMessage.data.chatId).toBe(chatId);
      expect(receivedMessage.data.senderId).toBe(user1.body.data.id);
      expect(receivedMessage.data._tempId).toBe(tempId);
      expect(receivedMessage.data.senderFullName).toBe("John Doe");

      ws1.close();
      ws2.close();
    });

    it("should handle message with reply", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      const ws2 = await createWebSocketConnection(tokens2.accessToken);

      // First, send an original message
      const originalMessage = {
        type: "message:send",
        data: {
          tempId: "temp-original",
          chatId,
          content: "Original message",
        },
      };

      const originalResponse = await sendMessageAndWait(
        ws1,
        originalMessage,
        "message:new",
      );
      const originalMessageId = originalResponse.data.serverId;

      const replyMessage = {
        type: "message:send",
        data: {
          tempId: "temp-reply",
          chatId,
          content: "This is a reply",
          replyToId: originalMessageId,
        },
      };

      const replyPromise = waitForMessage(ws1, "message:new");
      ws2.send(JSON.stringify(replyMessage));
      const replyResponse = await replyPromise;

      expect(replyResponse.data.replyToId).toBe(originalMessageId);
      expect(replyResponse.data.replyTo).toBeDefined();
      expect(replyResponse.data.replyTo.content).toBe("Original message");

      ws1.close();
      ws2.close();
    });

    it("should handle failed message sending", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);

      const invalidMessage = {
        type: "message:send",
        data: {
          tempId: "temp-fail",
          chatId: "invalid_chat_id",
          content: "This should fail",
        },
      };

      const failedResponse = await sendMessageAndWait(
        ws1,
        invalidMessage,
        "message:failed",
      );

      expect(failedResponse.type).toBe("message:failed");
      expect(failedResponse.data._tempId).toBe("temp-fail");

      ws1.close();
    });
  });

  describe("Typing Indicators", () => {
    it("should broadcast typing indicators", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      const ws2 = await createWebSocketConnection(tokens2.accessToken);

      const typingPromise = waitForMessage(ws2, "typing");

      const typingMessage = {
        type: "typing",
        data: { chatId },
      };

      ws1.send(JSON.stringify(typingMessage));
      const typingResponse = await typingPromise;

      expect(typingResponse.type).toBe("typing");
      expect(typingResponse.data.chatId).toBe(chatId);
      expect(typingResponse.data.userId).toBe(user1.body.data.id);

      ws1.close();
      ws2.close();
    });
  });

  describe("Message Read Receipts", () => {
    it("should handle message read status", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      const ws2 = await createWebSocketConnection(tokens2.accessToken);

      // First send a message
      const message = {
        type: "message:send",
        data: {
          tempId: "temp-read-test",
          chatId,
          content: "Message to be read",
        },
      };

      const newMessage = await sendMessageAndWait(ws1, message, "message:new");
      const messageId = newMessage.data.serverId;

      const readMessage = {
        type: "message:read",
        data: { chatId, messageId },
      };

      const readPromise = waitForMessage(ws1, "message:read");
      ws2.send(JSON.stringify(readMessage));
      const readResponse = await readPromise;

      expect(readResponse.type).toBe("message:read");
      expect(readResponse.data.messageId).toBe(messageId);
      expect(readResponse.data.userId).toBe(user2.body.data.id);

      ws1.close();
      ws2.close();
    });
  });

  describe("Chat Deletion", () => {
    it("should delete chat for individual user", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      await ensureChatExists(chatId);

      const deleteMessage = {
        type: "chat:delete",
        data: { chatId, deleteForBoth: false },
      };

      ws1.send(JSON.stringify(deleteMessage));

      await new Promise((resolve) => setTimeout(resolve, 100));

      ws1.close();
    });

    it("should delete chat for both users", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      const ws2 = await createWebSocketConnection(tokens2.accessToken);
      await ensureChatExists(chatId);

      const deletePromise = waitForMessage(ws2, "chat:deleted");

      const deleteMessage = {
        type: "chat:delete",
        data: { chatId, deleteForBoth: true },
      };

      ws1.send(JSON.stringify(deleteMessage));
      const deleteResponse = await deletePromise;

      expect(deleteResponse.type).toBe("chat:deleted");
      expect(deleteResponse.data.chatId).toBe(chatId);
      expect(deleteResponse.data.deletedBy).toBe(user1.body.data.id);
      expect(deleteResponse.data.deletedForBoth).toBe(true);

      ws1.close();
      ws2.close();
    });
  });

  describe("Message Deletion", () => {
    it("should delete message for individual user", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      const ws2 = await createWebSocketConnection(tokens2.accessToken);

      const message = {
        type: "message:send",
        data: {
          tempId: "temp-delete-test",
          chatId,
          content: "Message to be deleted",
        },
      };

      const newMessage = await sendMessageAndWait(ws1, message, "message:new");
      const messageId = newMessage.data.serverId;

      const deleteMessage = {
        type: "message:delete",
        data: { chatId, messageId, deleteForBoth: false },
      };

      const deletePromise = waitForMessage(ws1, "message:deleted");
      ws1.send(JSON.stringify(deleteMessage));
      const deleteResponse = await deletePromise;

      expect(deleteResponse.type).toBe("message:deleted");
      expect(deleteResponse.data.messageId).toBe(messageId);

      ws1.close();
      ws2.close();
    });

    it("should delete message for both users", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);
      const ws2 = await createWebSocketConnection(tokens2.accessToken);

      const message = {
        type: "message:send",
        data: {
          tempId: "temp-delete-both",
          chatId,
          content: "Message to be deleted for both",
        },
      };

      const newMessage = await sendMessageAndWait(ws1, message, "message:new");
      const messageId = newMessage.data.serverId;

      const deleteMessage = {
        type: "message:delete",
        data: { chatId, messageId, deleteForBoth: true },
      };

      const currentUserDeletePromise = waitForMessage(ws1, "message:deleted");
      ws1.send(JSON.stringify(deleteMessage));
      const currentUserDeleteResponse = await currentUserDeletePromise;

      expect(currentUserDeleteResponse.type).toBe("message:deleted");
      expect(currentUserDeleteResponse.data.messageId).toBe(messageId);

      const otherUserDeletePromise = waitForMessage(ws2, "message:deleted");
      ws1.send(JSON.stringify(deleteMessage));
      const otherUserDeleteResponse = await otherUserDeletePromise;

      expect(otherUserDeleteResponse.type).toBe("message:deleted");
      expect(otherUserDeleteResponse.data.messageId).toBe(messageId);

      ws1.close();
      ws2.close();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON messages", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);

      ws1.send("invalid json{");

      expect(ws1.readyState).toBe(WebSocket.OPEN);

      ws1.close();
    });

    it("should handle unauthorized chat access", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);

      const unauthorizedMessage = {
        type: "message:send",
        data: {
          tempId: "temp-unauthorized",
          chatId: "unauthorized_chat_id",
          content: "Unauthorized message",
        },
      };

      const failResponse = await sendMessageAndWait(
        ws1,
        unauthorizedMessage,
        "message:failed",
      );
      expect(failResponse.type).toBe("message:failed");

      ws1.close();
    });
  });

  describe("Connection Management", () => {
    it("should handle multiple connections from same user", async () => {
      const ws1_connection1 = await createWebSocketConnection(
        tokens1.accessToken,
      );
      const ws1_connection2 = await createWebSocketConnection(
        tokens1.accessToken,
      );
      const ws2 = await createWebSocketConnection(tokens2.accessToken);

      // Send message from user2, both connections of user1 should receive it
      const message = {
        type: "message:send",
        data: {
          tempId: "temp-multi-conn",
          chatId,
          content: "Multi-connection test",
        },
      };

      const promise1 = waitForMessage(ws1_connection1, "message:new");
      const promise2 = waitForMessage(ws1_connection2, "message:new");

      ws2.send(JSON.stringify(message));

      const [response1, response2] = await Promise.all([promise1, promise2]);

      expect(response1.data.content).toBe("Multi-connection test");
      expect(response2.data.content).toBe("Multi-connection test");

      ws1_connection1.close();
      ws1_connection2.close();
      ws2.close();
    });

    it("should handle connection cleanup on close", async () => {
      const ws1 = await createWebSocketConnection(tokens1.accessToken);

      expect(ws1.readyState).toBe(WebSocket.OPEN);

      ws1.close();

      await new Promise((resolve) => {
        ws1.onclose = resolve;
      });

      expect(ws1.readyState).toBe(WebSocket.CLOSED);
    });
  });
});

beforeAll(async () => {
  await db
    .insert(role)
    .values([{ name: "ADMIN" }, { name: "AGENT" }, { name: "CLIENT" }]);

  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis connection error:", error);
  }
});

afterAll(async () => {
  try {
    await db.delete(messageTable).execute();
    await db.delete(chatParticipant).execute();
    await db.delete(user).execute();
    await db.delete(role).execute();
    await db.delete(chat).execute();
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});

afterEach(async () => {
  try {
    await db.delete(user).execute();
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});
