import { user } from "../db/schemas/user";

export {};

declare global {
  type User = typeof user.$inferInsert;
}
