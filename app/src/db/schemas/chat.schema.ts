import {
  pgTable,
  uuid,
  primaryKey,
  text,
  timestamp,
  jsonb,
  type AnyPgColumn,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { user } from "./user.schema";
import { desc, relations, sql } from "drizzle-orm";

export const chat = pgTable(
  "chat",
  {
    id: text().primaryKey(),
    deletedAt: timestamp(),
    ...timestamps,
  },
  (table) => [
    index("idx_chat_active")
      .on(table.id)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const chatParticipant = pgTable(
  "chat_participant",
  {
    chatId: text()
      .references(() => chat.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid()
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    lastReadMessageId: uuid().references(() => message.id, {
      onDelete: "set null",
    }),
    leftAt: timestamp(),
    joinedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.chatId, table.userId],
    }),
    index("idx_chat_participant_user").on(table.userId),
    index("idx_chat_participant_active")
      .on(table.chatId, table.userId)
      .where(sql`${table.leftAt} IS NULL`),
  ],
);

export const messageTypeEnum = pgEnum("message_type", [
  "TEXT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "FILE",
  "VOICE",
  "LOCATION",
  "SYSTEM",
  "DELETED",
]);

export const message = pgTable(
  "message",
  {
    id: uuid().primaryKey().defaultRandom(),
    chatId: text().references(() => chat.id, { onDelete: "set null" }),
    senderId: uuid()
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    content: text().notNull(),
    type: messageTypeEnum().default("TEXT"),
    replyToId: uuid().references((): AnyPgColumn => message.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp(),
    deletedForId: uuid().references(() => user.id, { onDelete: "set null" }),
    metadata: jsonb(),
    ...timestamps,
  },
  (table) => [
    index("idx_message_sender").on(table.senderId),
    index("idx_message_reply_to")
      .on(table.replyToId)
      .where(sql`${table.replyToId} IS NOT NULL`),
    index("idx_message_chat_created_desc").on(
      table.chatId,
      desc(table.createdAt),
    ),
    index("idx_message_chat_created_not_deleted")
      .on(table.chatId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    index("idx_message_deleted_for").on(table.deletedForId),
  ],
);

export const chatParticipantRelations = relations(
  chatParticipant,
  ({ one }) => ({
    participant: one(user, {
      fields: [chatParticipant.userId],
      references: [user.id],
    }),
    chat: one(chat, {
      fields: [chatParticipant.chatId],
      references: [chat.id],
    }),
    lastReadMessage: one(message, {
      fields: [chatParticipant.lastReadMessageId],
      references: [message.id],
    }),
  }),
);

export const chatRelations = relations(chat, ({ many }) => ({
  participants: many(chatParticipant),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
    relationName: "sentMessages",
  }),
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
  replyTo: one(message, {
    fields: [message.replyToId],
    references: [message.id],
    relationName: "replyTo",
  }),
  replies: many(message, {
    relationName: "replyTo",
  }),
  deletedFor: one(user, {
    fields: [message.deletedForId],
    references: [user.id],
    relationName: "deletedMessages",
  }),
}));
