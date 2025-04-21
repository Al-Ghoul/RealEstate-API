import { db } from "../db";
import { user } from "../db/schemas/user";
import { eq, and, isNull } from "drizzle-orm";
import { type UpdateUserDTO } from "../lib/dtos/users.dto";

export async function createUser(input: Omit<User, "id">) {
  return await db
    .insert(user)
    .values({ ...input })
    .returning({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      emailVerified: user.emailVerified,
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
      lastName: user.lastName,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
  return await db.update(user).set({ password }).where(eq(user.id, id));
}

export async function getUserById(id: string) {
  return await db
    .select({
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
}

export async function updateUserImage(id: string, image: string) {
  return await db.update(user).set({ image }).where(eq(user.id, id));
}

export async function updateUser(id: string, input: UpdateUserDTO) {
  const [currentUser] = await db.select().from(user).where(eq(user.id, id));
  const isEmailChanging = input.email && input.email !== currentUser.email;
  return await db
    .update(user)
    .set({
      ...input,
      emailVerified: isEmailChanging ? null : undefined,
    })
    .where(eq(user.id, id));
}
