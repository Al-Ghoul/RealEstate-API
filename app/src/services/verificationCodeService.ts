import { db } from "../db";
import { verificationCode } from "../db/schemas/verificationCode";
import { and, eq, gt } from "drizzle-orm";

export async function getVerCodeByUserIdAndType(
  userId: string,
  type: NonNullable<CodeType>,
) {
  return await db
    .select({
      id: verificationCode.id,
    })
    .from(verificationCode)
    .where(
      and(
        eq(verificationCode.userId, userId),
        eq(verificationCode.type, type),
        gt(verificationCode.expiresAt, new Date()),
      ),
    );
}

export async function createVerificationCode(
  user: Partial<User>,
  code: string,
  type: NonNullable<CodeType>,
) {
  return await db.insert(verificationCode).values({
    code,
    userId: user.id,
    type,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes,
  });
}
