import { pgTable, uuid, boolean, primaryKey, text } from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { user } from "./user.schema";
import { relations } from "drizzle-orm";

export const chat = pgTable("chat", {
  id: uuid().primaryKey().defaultRandom(),
  isGroup: boolean().default(false),
  ...timestamps,
});

export const chatParticipant = pgTable(
  "chat_participant",
  {
    chatId: uuid()
      .references(() => chat.id)
      .notNull(),
    userId: uuid()
      .references(() => user.id)
      .notNull(),
    lastReadMessageId: uuid("last_read_message_id"),
  },
  (table) => [
    primaryKey({
      columns: [table.chatId, table.userId],
    }),
  ],
);

export const message = pgTable("message", {
  id: uuid().primaryKey().defaultRandom(),
  chatId: uuid()
    .references(() => chat.id)
    .notNull(),
  senderId: uuid()
    .references(() => user.id)
    .notNull(),
  content: text().notNull(),
  ...timestamps,
});

export const userToChatRelations = relations(chatParticipant, ({ one }) => ({
  user: one(user, {
    fields: [chatParticipant.userId],
    references: [user.id],
  }),
  chat: one(chat, {
    fields: [chatParticipant.chatId],
    references: [chat.id],
  }),
}));

export const chatRelations = relations(chat, ({ many }) => ({
  participants: many(chatParticipant),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}));
