import { createLogger, format, transports } from "winston";
import { errorsTransport, generalTransport } from "../config/logger.config";
import { env } from "../config/env.config";

export const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [errorsTransport, generalTransport],
});

if (env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}
