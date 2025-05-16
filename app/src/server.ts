import { app } from "./app";
import { env } from "./config/env.config";
import { logger } from "./utils/logger.utils";
import { redisClient } from "./utils/redis.utils";

console.log(`Server running on port ${env.PORT.toString()}`);
console.log(`Environment: ${env.NODE_ENV}`);

redisClient.connect().catch((error: unknown) => {
  if (error instanceof Error) {
    logger.error({
      message: "Redis connection error",
      info: {
        error: error.message,
        stack: error.stack,
      },
    });
  } else {
    logger.error({
      message: "Redis connection error",
      info: {
        error,
      },
    });
  }
});

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT.toString()}`);
});
