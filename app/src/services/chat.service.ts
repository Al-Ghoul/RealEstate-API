import { first } from "lodash-es";
import { db } from "../db";
import { chat, chatParticipant } from "../db/schemas/chat.schema";
import { and, eq, inArray } from "drizzle-orm";

export async function createChat(userId: User["id"], targetUserId: User["id"]) {
  const userChats = await db
    .select({ chatId: chatParticipant.chatId })
    .from(chatParticipant)
    .where(eq(chatParticipant.userId, userId));

  const chatIds = userChats.map((chat) => chat.chatId);

  if (chatIds.length > 0) {
    const existingChat = first(
      await db
        .select({ chatId: chat.id })
        .from(chat)
        .innerJoin(chatParticipant, eq(chat.id, chatParticipant.chatId))
        .where(
          and(
            inArray(chat.id, chatIds),
            eq(chatParticipant.userId, targetUserId),
          ),
        )
        .limit(1),
    );

    if (existingChat) return existingChat;
  }

  const newChat = first(await db.insert(chat).values({}).returning());

  if (!newChat) throw new Error("Failed to create chat");

  await db.insert(chatParticipant).values([
    { chatId: newChat.id, userId },
    { chatId: newChat.id, userId: targetUserId },
  ]);

  return { chatId: newChat.id };
}
