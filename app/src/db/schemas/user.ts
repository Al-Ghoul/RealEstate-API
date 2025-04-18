import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helpers";
import { relations } from "drizzle-orm";
import { notification } from "./notification";
import { verificationCode } from "./verificationCode";

export const user = pgTable(
  "user",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar({ length: 255 }).unique().notNull(),
    password: varchar({ length: 255 }).notNull(),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    emailVerified: timestamp(),
    image: varchar({ length: 255 }),
    ...timestamps,
  },
  (table) => [unique().on(table.firstName, table.lastName)],
);

export const usersRelations = relations(user, ({ many }) => ({
  notifications: many(notification),
  verificationCodes: many(verificationCode),
}));
