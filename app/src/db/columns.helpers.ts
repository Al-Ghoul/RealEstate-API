import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
};
