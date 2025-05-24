import {
  pgTable,
  serial,
  text,
  numeric,
  uuid,
  index,
  geometry,
  pgEnum,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { user } from "./user.schema";
import { relations, sql } from "drizzle-orm";
import { propertyView } from "./propertyView.schema";
import { propertyMedia } from "./propertyMedia.schema";

export const propertyType = pgEnum("property_type", [
  "apartment",
  "house",
  "land",
  "coastal",
  "commercial",
]);

export const propertyStatus = pgEnum("property_status", [
  "available",
  "rented",
  "sold",
]);

export const property = pgTable(
  "property",
  {
    id: serial().primaryKey(),
    title: text().notNull().unique(),
    description: text().notNull(),
    price: numeric().notNull(),
    type: propertyType().notNull(),
    status: propertyStatus().notNull(),
    area: integer().notNull(),
    rooms: integer().notNull(),
    isPublished: boolean().notNull().default(false),
    isFeatured: boolean().notNull().default(false),
    thumbnailURL: text().notNull(),
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

export const propertiesRelations = relations(property, ({ one, many }) => ({
  user: one(user, {
    fields: [property.userId],
    references: [user.id],
  }),
  views: many(propertyView),
  media: many(propertyMedia),
}));
