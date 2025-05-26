import { pgTable, serial, integer, text, pgEnum } from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { relations } from "drizzle-orm";
import { property } from "./property.schema";

export const propertyMediaType = pgEnum("property_media_type", [
  "IMAGE",
  "VIDEO",
]);

export const propertyMedia = pgTable("property_media", {
  id: serial().primaryKey(),
  propertyId: integer()
    .notNull()
    .references(() => property.id, { onDelete: "cascade" }),
  url: text().notNull(),
  type: propertyMediaType().notNull(),
  mimeType: text().notNull(),
  ...timestamps,
});

export const propertyMediaRelations = relations(propertyMedia, ({ one }) => ({
  property: one(property, {
    fields: [propertyMedia.propertyId],
    references: [property.id],
  }),
}));
