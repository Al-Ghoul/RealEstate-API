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

export const user = pgTable(
  "user",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar({ length: 255 }),
    password: varchar({ length: 255 }),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    emailVerified: timestamp(),
    image: varchar({ length: 255 }),
    ...timestamps,
  },

  (table) => [uniqueIndex("emailUniqueIndex").on(lower(table.email))],
);

export const usersRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  notifications: many(notification),
  verificationCodes: many(verificationCode),
}));
