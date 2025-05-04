import { first } from "lodash-es";
import { db } from "../db";
import { verificationCode } from "../db/schemas/verificationCode";
import { and, eq, gt, isNull } from "drizzle-orm";

export async function getVerCodeByUserIdAndType(
  userId: User["id"],
  type: Code["type"],
) {
  return first(
    await db
      .select({
        id: verificationCode.id,
      })
      .from(verificationCode)
      .where(
        and(
          eq(verificationCode.userId, userId),
          eq(verificationCode.type, type),
          isNull(verificationCode.usedAt),
          gt(verificationCode.expiresAt, new Date()),
        ),
      )
      .limit(1),
  );
}

export async function createVerificationCode(
  user: Partial<User>,
  code: Code["code"],
  type: Code["type"],
) {
  return db.insert(verificationCode).values({
    code,
    userId: user.id as string,
    type,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes,
  });
}

export async function getUnUsedVerCodeByCodeAndUserId(
  code: Code["code"],
  userId: User["id"],
) {
  return db
    .select({
      id: verificationCode.id,
      userId: verificationCode.userId,
    })
    .from(verificationCode)
    .where(
      and(
        and(
          eq(verificationCode.userId, userId),
          eq(verificationCode.code, code),
          isNull(verificationCode.usedAt),
        ),
        gt(verificationCode.expiresAt, new Date()),
      ),
    );
}

export async function useVerificationCode(id: number) {
  return db
    .update(verificationCode)
    .set({ usedAt: new Date() })
    .where(eq(verificationCode.id, id));
}

export async function getVerCodeByCodeAndType(
  code: Code["code"],
  type: Code["type"],
) {
  return first(
    await db
      .select({
        id: verificationCode.id,
        userId: verificationCode.userId,
      })
      .from(verificationCode)
      .where(
        and(
          eq(verificationCode.code, code),
          eq(verificationCode.type, type),
          isNull(verificationCode.usedAt),
          gt(verificationCode.expiresAt, new Date()),
        ),
      )
      .limit(1),
  );
}

export async function deleteVerificationCodeByCode(code: Code["code"]) {
  return db.delete(verificationCode).where(eq(verificationCode.code, code));
}
