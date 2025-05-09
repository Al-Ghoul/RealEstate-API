import { createClient } from "redis";
import { env } from "./env.config";

export const redis = createClient({ url: env.REDIS_URL });

redis.connect().catch(console.error);

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
