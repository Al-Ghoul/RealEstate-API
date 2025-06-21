import { app } from "./app";
import { env } from "./config/env.config";
import { logger } from "./utils/logger.utils";
import { redisClient } from "./utils/redis.utils";
import "./wsServer";

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
  console.log(`Server is running on PORT:${env.PORT.toString()}`);
});
