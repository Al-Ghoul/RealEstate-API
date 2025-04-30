import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { lower, timestamps } from "../columns.helpers";
import { relations } from "drizzle-orm";
import { notification } from "./notification";
import { verificationCode } from "./verificationCode";
import { account } from "./account";
import { profile } from "./profile";

export const user = pgTable(
  "user",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar({ length: 255 }),
    password: varchar({ length: 255 }),
    emailVerified: timestamp(),
    ...timestamps,
  },

  (table) => [uniqueIndex("emailUniqueIndex").on(lower(table.email))],
);

export const userRelations = relations(user, ({ many, one }) => ({
  profile: one(profile),
  accounts: many(account),
  notifications: many(notification),
  verificationCodes: many(verificationCode),
}));
