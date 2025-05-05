import winston, { createLogger, format, transports } from "winston";
import { env } from "../env";
import "winston-daily-rotate-file";

const errorsTransport = new winston.transports.DailyRotateFile({
  level: "error",
  filename: "./log/errors-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const generalTransport = new winston.transports.DailyRotateFile({
  level: "info",
  filename: "./log/general-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

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
