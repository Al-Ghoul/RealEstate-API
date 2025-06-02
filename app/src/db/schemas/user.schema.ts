import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { lower, timestamps } from "../helpers/time.helpers";
import { relations } from "drizzle-orm";
import { notification } from "./notification.schema";
import { verificationCode } from "./verificationCode.schema";
import { account } from "./account.schema";
import { profile } from "./profile.schema";
import { userRole } from "./userRole.schema";
import { property } from "./property.schema";
import { propertyView } from "./propertyView.schema";
import { chatParticipant, message } from "./chat.schema";

export const user = pgTable(
  "user",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar({ length: 255 }),
    password: varchar({ length: 255 }),
    emailVerified: timestamp(),
    ...timestamps,
  },

  (table) => [uniqueIndex("emailUniqueIndex").on(lower(table.email))],
);

export const userRelations = relations(user, ({ many, one }) => ({
  profile: one(profile),
  accounts: many(account),
  notifications: many(notification),
  verificationCodes: many(verificationCode),
  roles: many(userRole),
  properties: many(property),
  propertyViews: many(propertyView),
  chats: many(chatParticipant),
  messages: many(message),
}));
