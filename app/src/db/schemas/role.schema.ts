import { pgEnum, pgTable, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "../helpers/time.helpers";
import { userRole } from "./userRole.schema";

export const roleType = pgEnum("role_type", ["AGENT", "CLIENT", "ADMIN"]);

export const role = pgTable("role", {
  id: serial().primaryKey(),
  name: roleType().notNull().unique(),
  ...timestamps,
});

export const rolesRelations = relations(role, ({ many }) => ({
  users: many(userRole),
}));
