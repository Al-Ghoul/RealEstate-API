import { db } from "../db";
import { user } from "../db/schemas/user";
import { eq, and, isNull } from "drizzle-orm";

export async function createUser(input: Omit<User, "id">) {
  return await db
    .insert(user)
    .values({ ...input })
    .returning({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailNerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
}

export async function getUser(email: string) {
  return await db
    .select({ id: user.id, password: user.password })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
}

export async function getUnVerifiedUser(email: string) {
  return await db
    .select({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    })
    .from(user)
    .where(and(eq(user.email, email), isNull(user.emailVerified)))
    .limit(1);
}
