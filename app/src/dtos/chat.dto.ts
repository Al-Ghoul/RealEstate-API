import { createSchemaFactory } from "drizzle-zod";
import { zodInstance } from "../utils/swagger.utils";
import { chatParticipant, message } from "../db/schemas/chat.schema";
import { z } from "zod";
import { baseProfileDTO } from "./profile.dto";
import { baseUserDTO } from "./user.dto";
import { metaSchema } from ".";

const { createInsertSchema } = createSchemaFactory({
  zodInstance,
  coerce: {
    date: true,
  },
});

export const baseChatParticipantDTO = createInsertSchema(chatParticipant, {});

export const chatOutputDTO = baseChatParticipantDTO
  .pick({
    chatId: true,
    lastReadMessageId: true,
  })
  .extend({
    otherUserId: baseUserDTO.shape.id,
    otherUserFullName: baseProfileDTO.shape.firstName,
    lastMessageContent: z.string(),
    lastMessageCreatedAt: z.date(),
    lastMessageSenderId: baseUserDTO.shape.id,
    unreadCount: z.number(),
  });

export const chatQueryParams = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe("Limit the number of records returned"),
  cursor: z
    .string()
    .uuid()
    .optional()
    .describe("Cursor ID to paginate after a specific chat"),

  cursorCreatedAt: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined))
    .describe("Cursor created_at to paginate after a specific chat"),
});

export const chatQueryParamsSchema = chatQueryParams.openapi({
  param: {
    in: "query",
  },
});

export const getChatByIdInputDTO = z
  .object({
    id: z.coerce.string(),
  })
  .strict()
  .openapi({
    param: {
      in: "path",
    },
  });

export type ChatQueryParams = z.infer<typeof chatQueryParams>;

export const chatMetaSchema = metaSchema
  .pick({
    has_next_page: true,
    has_previous_page: true,
    count: true,
    per_page: true,
    next_cursor: true,
  })
  .extend({
    next_cursor_created_at: z
      .string()
      .optional()
      .transform((value) => (value ? new Date(value) : undefined))
      .describe("Cursor created_at to paginate after a specific property"),
  });

export const baseMessageDTO = createInsertSchema(message, {});

export const messageOutputDTO = baseMessageDTO
  .pick({
    id: true,
    chatId: true,
    senderId: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    replyToId: true,
  })
  .extend({
    replyTo: baseMessageDTO.pick({
      id: true,
      content: true,
      senderId: true,
      createdAt: true,
    }),
  });
