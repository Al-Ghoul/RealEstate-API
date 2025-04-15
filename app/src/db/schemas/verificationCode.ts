import {
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { timestamps } from "../columns.helpers";
import { relations } from "drizzle-orm";

export const codeType = pgEnum("code_type", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
]);

export const verificationCode = pgTable("verification_code", {
  id: serial().primaryKey(),
  code: varchar({ length: 255 }).notNull(),
  userId: uuid().references(() => user.id),
  type: codeType(),
  expiresAt: timestamp().notNull(),
  usedAt: timestamp(),
  ...timestamps,
});

export const verificationCodesRelations = relations(
  verificationCode,
  ({ one }) => ({
    user: one(user, {
      fields: [verificationCode.userId],
      references: [user.id],
    }),
  }),
);
