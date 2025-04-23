import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helpers";
import { relations } from "drizzle-orm";
import { notification } from "./notification";
import { verificationCode } from "./verificationCode";
import { account } from "./account";

export const user = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).unique(),
  password: varchar({ length: 255 }),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  emailVerified: timestamp(),
  image: varchar({ length: 255 }),
  ...timestamps,
});

export const usersRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  notifications: many(notification),
  verificationCodes: many(verificationCode),
}));
