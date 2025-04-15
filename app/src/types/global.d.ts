import { notification } from "../db/schemas/notification";
import { user } from "../db/schemas/user";
import { verificationCode } from "../db/schemas/verificationCode";

export {};

declare global {
  type User = typeof user.$inferInsert;
  type CodeType = (typeof verificationCode.$inferSelect)["type"];
  type NotificationType = typeof notification.$inferSelect;

  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}
