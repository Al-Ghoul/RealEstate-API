import { SQL, sql } from "drizzle-orm";
import { AnyPgColumn, timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
};

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
