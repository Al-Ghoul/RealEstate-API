import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../helpers/time.helpers";
import { relations } from "drizzle-orm";
import { user } from "./user.schema";

export const profile = pgTable("profile", {
  userId: uuid()
    .references(() => user.id, { onDelete: "cascade" })
    .primaryKey(),
  firstName: varchar({ length: 16 }),
  lastName: varchar({ length: 16 }),
  bio: varchar({ length: 255 }),
  image: text(),
  imageBlurHash: text(),
  ...timestamps,
});

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
}));
