import { RedisClient } from "bun";
import { env } from "../config/env.config";

export const redisClient = new RedisClient(env.REDIS_URL, {
  enableOfflineQueue: false,
});
