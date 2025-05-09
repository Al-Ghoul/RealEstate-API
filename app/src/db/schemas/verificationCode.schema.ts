import {
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user.schema";
import { timestamps } from "../helpers/time.helpers";
import { relations } from "drizzle-orm";

export const codeType = pgEnum("code_type", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
]);

export const verificationCode = pgTable("verification_code", {
  id: serial().primaryKey(),
  userId: uuid()
    .references(() => user.id)
    .notNull(),
  code: varchar({ length: 7 }).notNull(),
  type: codeType().notNull(),
  expiresAt: timestamp().notNull(),
  usedAt: timestamp(),
  ...timestamps,
});

export const verificationCodeRelations = relations(
  verificationCode,
  ({ one }) => ({
    user: one(user, {
      fields: [verificationCode.userId],
      references: [user.id],
    }),
  }),
);
