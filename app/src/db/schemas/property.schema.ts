import {
  pgTable,
  serial,
  text,
  doublePrecision,
  numeric,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { user } from "./user.schema";
import { relations } from "drizzle-orm";

export const property = pgTable("property", {
  id: serial().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  price: numeric().notNull(),
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
  userId: uuid()
    .references(() => user.id)
    .notNull(),
  ...timestamps,
});

export const propertiesRelation = relations(property, ({ one }) => ({
  user: one(user, {
    fields: [property.userId],
    references: [user.id],
  }),
}));
