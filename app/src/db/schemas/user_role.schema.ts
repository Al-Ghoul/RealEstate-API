import { integer, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./user.schema";
import { role } from "./role.schema";
import { timestamps } from "../helpers/time.helpers";
import { relations } from "drizzle-orm";

export const userRole = pgTable(
  "user_role",
  {
    userId: uuid().references(() => user.id, { onDelete: "cascade" }),
    roleId: integer().references(() => role.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [unique().on(table.userId, table.roleId)],
);

export const userToRolesRelations = relations(userRole, ({ one }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
  }),
  role: one(role, {
    fields: [userRole.roleId],
    references: [role.id],
  }),
}));
