import { db } from "../db";
import { notification } from "../db/schemas/notification";

export async function createNotification(
  input: Omit<
    NotificationType,
    "id" | "status" | "sentAt" | "createdAt" | "updatedAt"
  > & {
    isSent: boolean;
  },
) {
  return db
    .insert(notification)
    .values({
      userId: input.userId,
      type: input.type,
      recipient: input.recipient,
      subject: input.subject,
      message: input.message,
      status: input.isSent ? "SENT" : "PENDING",
      sentAt: input.isSent ? new Date() : null,
    })
    .returning();
}
