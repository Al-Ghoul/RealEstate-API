import { pgTable, primaryKey, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./user.schema";
import { timestamps } from "../helpers/time.helpers";
import { relations } from "drizzle-orm";

export const account = pgTable(
  "account",
  {
    userId: uuid()
      .references(() => user.id)
      .notNull(),
    provider: varchar({ length: 255 }).notNull(),
    providerAccountId: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  ],
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
