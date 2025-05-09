import { notification } from "../db/schemas/notification.schema";
import { user } from "../db/schemas/user.schema";
import { verificationCode } from "../db/schemas/verificationCode.schema";
import { profile } from "../db/schemas/profile.schema";

declare global {
  type User = typeof user.$inferSelect;
  type Profile = typeof profile.$inferInsert;
  type Code = typeof verificationCode.$inferSelect;
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
      id: string;
      user?: Pick<User, "id">;
    }
  }
}

declare module "jsonwebtoken" {
  interface JwtPayload {
    token_type: "access" | "refresh";
  }
}
