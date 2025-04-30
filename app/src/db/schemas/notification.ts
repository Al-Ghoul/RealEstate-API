import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  pgEnum,
  bigserial,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helpers";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const notificationTypeEnum = pgEnum("notification_type", [
  "EMAIL",
  "SMS",
  "PUSH",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);

export const notification = pgTable("notification", {
  id: bigserial({ mode: "number" }).primaryKey(),
  userId: uuid()
    .references(() => user.id)
    .notNull(),
  type: notificationTypeEnum().notNull(),
  recipient: varchar({ length: 255 }).notNull(), // Email or phone number
  subject: varchar({ length: 255 }),
  message: text().notNull(),
  status: notificationStatusEnum().notNull().default("PENDING"),
  sentAt: timestamp(),
  ...timestamps,
});

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));
