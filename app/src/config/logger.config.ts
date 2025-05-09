import winston from "winston";
import "winston-daily-rotate-file";
import { join } from "path";

export const errorsTransport = new winston.transports.DailyRotateFile({
  level: "error",
  filename: join(process.cwd(), "./log/errors-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

export const generalTransport = new winston.transports.DailyRotateFile({
  level: "info",
  filename: join(process.cwd(), "./log/general-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});
