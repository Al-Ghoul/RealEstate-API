import { pgTable, serial, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { user } from "./user.schema";
import { relations } from "drizzle-orm";
import { property } from "./property.schema";

export const propertyView = pgTable("property_view", {
  id: serial().primaryKey(),
  userId: uuid().references(() => user.id, { onDelete: "cascade" }),
  propertyId: integer().references(() => property.id, { onDelete: "cascade" }),
  viewedAt: timestamp().defaultNow(),
  ...timestamps,
});

export const propertyViewsRelations = relations(propertyView, ({ one }) => ({
  user: one(user, {
    fields: [propertyView.userId],
    references: [user.id],
  }),
  property: one(property, {
    fields: [propertyView.propertyId],
    references: [property.id],
  }),
}));
