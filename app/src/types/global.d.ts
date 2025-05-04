import { notification } from "../db/schemas/notification";
import { user } from "../db/schemas/user";
import { verificationCode } from "../db/schemas/verificationCode";
import { profile } from "../db/schemas/profile";

declare global {
  type User = typeof user.$inferSelect;
  type Profile = typeof profile.$inferInsert;
  type CodeType = (typeof verificationCode.$inferSelect)["type"];
  type NotificationType = typeof notification.$inferSelect;

  interface FacebookDebugTokenResponse {
    data: {
      is_valid: boolean;
      app_id: string;
      user_id: string;
    };
  }
  interface FacebookUser {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    picture: {
      data: {
        height: number;
        width: number;
        url: string;
        is_silhouette: boolean;
      };
    };
  }

  namespace Express {
    interface Request {
      id?: string;
      user?: { id: string };
    }
  }
}

export {};
