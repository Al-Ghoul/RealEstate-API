import { db } from "../db";
import { user } from "../db/schemas/user";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

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
    .select({
      id: user.id,
      password: user.password,
      email: user.email,
      firstName: user.firstName,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
}

export async function getUnVerifiedUserById(id: string) {
  return await db
    .select({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
    })
    .from(user)
    .where(and(eq(user.id, id), isNull(user.emailVerified)))
    .limit(1);
}

export async function verifyUser(id: string) {
  return await db
    .update(user)
    .set({ emailVerified: new Date() })
    .where(eq(user.id, id));
}

export async function updateUserPassword(id: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await db
    .update(user)
    .set({ password: hashedPassword })
    .where(eq(user.id, id));
}
