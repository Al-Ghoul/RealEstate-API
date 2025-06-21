import { db } from "../db";
import { chat, chatParticipant, message } from "../db/schemas/chat.schema";
import { and, eq, lt, ne, desc, or, sql, isNull, isNotNull } from "drizzle-orm";
import { user } from "../db/schemas/user.schema";
import { alias } from "drizzle-orm/pg-core";
import { profile } from "../db/schemas/profile.schema";
import type { ChatQueryParams } from "../dtos/chat.dto";
import { first } from "lodash-es";

export async function ensureParticipant(
  chatId: string,
  userId: string,
): Promise<boolean> {
  const isParticipant = first(
    await db
      .select()
      .from(chatParticipant)
      .where(
        and(
          eq(chatParticipant.chatId, chatId),
          eq(chatParticipant.userId, userId),
        ),
      ),
  );

  return !!isParticipant;
}

export async function ensureChatExists(chatId: string) {
  const [userId1, userId2] = chatId.split("_");

  const existing = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);

  if (!existing.length) {
    await db.transaction(async (tx) => {
      await tx.insert(chat).values({ id: chatId });
      await tx.insert(chatParticipant).values([
        { chatId, userId: userId1 },
        { chatId, userId: userId2 },
      ]);
    });
  }
}

export async function getUserChats(
  input: ChatQueryParams & {
    userId: User["id"];
  },
) {
  const { userId, limit, cursor, cursorCreatedAt } = input;
  const cpOther = alias(chatParticipant, "cpOther");
  const cpCurrent = alias(chatParticipant, "cpCurrent");
  const lastMsg = alias(message, "lastMsg");
  const otherUser = alias(user, "otherUser");
  const otherProfile = alias(profile, "otherProfile");

  return await db
    .select({
      chatId: chat.id,
      otherUserId: otherUser.id,
      otherUserFullName: sql<string>`CONCAT(${otherProfile.firstName}, ' ', ${otherProfile.lastName})`,
      lastMessageId: lastMsg.id,
      lastMessageContent: lastMsg.content,
      lastMessageCreatedAt: lastMsg.createdAt,
      lastMessageSenderId: lastMsg.senderId,
      unreadCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${message}
        WHERE ${message.chatId} = ${chat.id}
        AND ${message.senderId} != ${userId}
        -- Updated: Handle new deletion logic for unread count
        AND (
          ${message.deletedAt} IS NULL 
          OR (${message.deletedAt} IS NOT NULL AND ${message.deletedForId} IS NOT NULL AND ${message.deletedForId} != ${userId})
        )
        AND ${message.createdAt} > GREATEST(
          COALESCE("chat"."deleted_at", TO_TIMESTAMP(0)),
          COALESCE("cpCurrent"."left_at", TO_TIMESTAMP(0)),
          COALESCE((
            SELECT ${message.createdAt}
            FROM ${message}
            WHERE ${message.id} = ${cpCurrent.lastReadMessageId}
          ), TO_TIMESTAMP(0))
        )
      )`.as("unreadCount"),
    })
    .from(cpCurrent)
    .innerJoin(chat, eq(chat.id, cpCurrent.chatId))
    .innerJoin(
      cpOther,
      and(eq(cpOther.chatId, chat.id), ne(cpOther.userId, userId)),
    )
    .innerJoin(otherUser, eq(otherUser.id, cpOther.userId))
    .innerJoin(otherProfile, eq(otherProfile.userId, otherUser.id))
    .leftJoin(
      lastMsg,
      and(
        eq(lastMsg.chatId, chat.id),
        or(
          isNull(lastMsg.deletedAt),
          and(
            isNotNull(lastMsg.deletedAt),
            isNotNull(lastMsg.deletedForId),
            ne(lastMsg.deletedForId, userId),
          ),
        ),
        eq(
          lastMsg.createdAt,
          db
            .select({ createdAt: message.createdAt })
            .from(message)
            .where(
              and(
                eq(message.chatId, chat.id),
                or(
                  isNull(message.deletedAt),
                  and(
                    isNotNull(message.deletedAt),
                    isNotNull(message.deletedForId),
                    ne(message.deletedForId, userId),
                  ),
                ),
              ),
            )
            .orderBy(desc(message.createdAt))
            .limit(1),
        ),
      ),
    )
    .where(
      and(
        eq(cpCurrent.userId, userId),
        cursorCreatedAt
          ? or(
              lt(
                sql`COALESCE(${lastMsg.createdAt}, TO_TIMESTAMP(0))`,
                cursorCreatedAt,
              ),
              and(
                eq(
                  sql`COALESCE(${lastMsg.createdAt}, TO_TIMESTAMP(0))`,
                  cursorCreatedAt,
                ),
                cursor
                  ? lt(
                      sql`COALESCE(${lastMsg.id}, '00000000-0000-0000-0000-000000000000')`,
                      cursor,
                    )
                  : sql`true`,
              ),
            )
          : sql`true`,
        sql`(
          (
            "chat"."deleted_at" IS NULL 
            AND "cpCurrent"."left_at" IS NULL 
            AND EXISTS (
              SELECT 1 FROM "message" 
              WHERE "message"."chat_id" = "chat"."id"
              AND (
                "message"."deleted_at" IS NULL 
                OR ("message"."deleted_at" IS NOT NULL AND "message"."deleted_for_id" IS NOT NULL AND "message"."deleted_for_id" != ${userId})
              )
            )
          )
          OR
          (
            -- Case 2: Either deleted or left (or both), but has visible messages after the most recent action
            ("chat"."deleted_at" IS NOT NULL OR "cpCurrent"."left_at" IS NOT NULL)
            AND EXISTS (
              SELECT 1 FROM "message"
              WHERE "message"."chat_id" = "chat"."id"
              AND "message"."created_at" > GREATEST(
                COALESCE("chat"."deleted_at", TO_TIMESTAMP(0)),
                COALESCE("cpCurrent"."left_at", TO_TIMESTAMP(0))
              )
              AND (
                "message"."deleted_at" IS NULL 
                OR ("message"."deleted_at" IS NOT NULL AND "message"."deleted_for_id" IS NOT NULL AND "message"."deleted_for_id" != ${userId})
              )
            )
          )
        )`,
      ),
    )
    .orderBy(desc(lastMsg.createdAt), desc(lastMsg.id))
    .limit(limit + 1);
}

export async function getUserChatMessages(
  input: ChatQueryParams & { chatId: Chat["id"]; userId: User["id"] },
) {
  const { chatId, userId, limit, cursor, cursorCreatedAt } = input;
  const replyMessage = alias(message, "reply_message");

  const messages = await db
    .select({
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      replyToId: message.replyToId,
      deletedAt: message.deletedAt,
      deletedForId: message.deletedForId,
      replyTo: {
        id: replyMessage.id,
        content: replyMessage.content,
        senderId: replyMessage.senderId,
        createdAt: replyMessage.createdAt,
        deletedAt: replyMessage.deletedAt,
        deletedForId: replyMessage.deletedForId,
      },
    })
    .from(message)
    .leftJoin(replyMessage, eq(message.replyToId, replyMessage.id))
    .leftJoin(chat, eq(message.chatId, chat.id))
    .leftJoin(
      chatParticipant,
      and(
        eq(chatParticipant.chatId, chatId),
        eq(chatParticipant.userId, userId),
      ),
    )
    .where(
      and(
        eq(message.chatId, chatId),
        or(
          isNull(message.deletedAt),
          and(
            isNotNull(message.deletedAt),
            isNotNull(message.deletedForId),
            ne(message.deletedForId, userId),
          ),
        ),

        // Only show messages after the cutoff point
        sql`(
          "message"."created_at" > COALESCE(
            GREATEST(
              "chat"."deleted_at",
              "chat_participant"."left_at"
            ),
            TO_TIMESTAMP('1970-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
          )
        )`,
        cursorCreatedAt
          ? sql`(
            "message"."created_at" < ${cursorCreatedAt}
            OR (
              "message"."created_at" = ${cursorCreatedAt}
              AND ${cursor ? sql`"message"."id" < ${cursor}` : sql`true`}
            )
          )`
          : sql`true`,
      ),
    )
    .orderBy(desc(message.createdAt), desc(message.id))
    .limit(limit + 1);

  const transformedMessages = messages.map((msg) => ({
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
    content: msg.content,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    replyToId: msg.replyToId,
    replyTo:
      msg.replyTo?.id &&
      (msg.replyTo.deletedAt === null ||
        (msg.replyTo.deletedForId !== null &&
          msg.replyTo.deletedForId !== userId))
        ? {
            id: msg.replyTo.id,
            content: msg.replyTo.content,
            senderId: msg.replyTo.senderId,
            createdAt: msg.replyTo.createdAt,
          }
        : null,
  }));

  return transformedMessages;
}

export async function getMessageByIdAndChatId(
  messageId: ChatMessage["id"],
  chatId: Chat["id"],
) {
  return first(
    await db
      .select()
      .from(message)
      .where(and(eq(message.id, messageId), eq(message.chatId, chatId))),
  );
}
