import { type Request, type Response, type NextFunction } from "express";
import { randomUUIDv7 } from "bun";
import morgan from "morgan";
import { createStream } from "rotating-file-stream";
import { join } from "path";

export function assignLogId(req: Request, _: Response, next: NextFunction) {
  req.id = randomUUIDv7();
  next();
}

morgan.token("id", function getId(req: Request) {
  return req.id;
});

morgan.token("response-time", (_: Request, res: Response) => {
  return (res.getHeader("X-Response-Time") as string) ?? "-";
});

const accessLogStream = createStream("access.log", {
  interval: "1d",
  path: join(process.cwd(), "log"),
});

const errorLogStream = createStream("error.log", {
  interval: "1d",
  path: join(process.cwd(), "log"),
});

const logFormat = `:id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version :status :res[content-length] ":referrer" ":user-agent :response-time"`;

export const errorLogger = morgan(logFormat, {
  skip: function (_, res) {
    return res.statusCode < 400;
  },
  stream: errorLogStream,
});

export const accessLogger = morgan(logFormat, {
  stream: accessLogStream,
});
