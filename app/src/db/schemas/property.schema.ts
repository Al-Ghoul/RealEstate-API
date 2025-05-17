import {
  pgTable,
  serial,
  text,
  numeric,
  uuid,
  index,
  geometry,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { user } from "./user.schema";
import { relations, sql } from "drizzle-orm";

export const property = pgTable(
  "property",
  {
    id: serial().primaryKey(),
    title: text().notNull().unique(),
    description: text().notNull(),
    price: numeric().notNull(),
    location: geometry({
      type: "point",
      mode: "xy",
      srid: 4326,
    }).notNull(),

    userId: uuid()
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index("search_index").using(
      "gin",
      sql`(
          setweight(to_tsvector('english', ${table.title}), 'A') ||
          setweight(to_tsvector('english', ${table.description}), 'B')
      )`,
    ),
    index("location_idx").using("gist", table.location),
    index("price_idx").on(table.price),
  ],
);

export const propertiesRelation = relations(property, ({ one }) => ({
  user: one(user, {
    fields: [property.userId],
    references: [user.id],
  }),
}));
