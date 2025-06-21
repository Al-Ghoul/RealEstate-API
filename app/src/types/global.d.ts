import { notification } from "../db/schemas/notification.schema";
import { user } from "../db/schemas/user.schema";
import { verificationCode } from "../db/schemas/verificationCode.schema";
import { profile } from "../db/schemas/profile.schema";
import { role } from "../db/schemas/role.schema";
import { property } from "../db/schemas/property.schema";
import { propertyMedia } from "../db/schemas/propertyMedia.schema";
import { chat } from "../db/schemas/chat.schema";
import { chatParticipant } from "../db/schemas/chatParticipant.schema";

declare global {
  type User = typeof user.$inferSelect;
  type Profile = typeof profile.$inferInsert;
  type Code = typeof verificationCode.$inferSelect;
  type NotificationType = typeof notification.$inferSelect;
  type Role = typeof role.$inferSelect;
  type Property = typeof property.$inferSelect;
  type PropertyMedia = typeof propertyMedia.$inferSelect;
  type Chat = typeof chat.$inferSelect;
  type ChatParticipant = typeof chatParticipant.$inferInsert;

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
      user?: Pick<User, "id"> & { roles: Array<Role["name"]> };
    }
  }
}

declare module "jsonwebtoken" {
  interface JwtPayload {
    token_type: "access" | "refresh";
    roles: Array<Role["name"]>;
    firstName: Profile["firstName"];
    lastName: Profile["lastName"];
  }
}
