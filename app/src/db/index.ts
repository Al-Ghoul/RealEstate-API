import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../config/env.config";

export const db = drizzle(env.DATABASE_URL, { casing: "snake_case" });
