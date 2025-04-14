import { db } from "../db";
import { user } from "../db/schemas/user";

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

