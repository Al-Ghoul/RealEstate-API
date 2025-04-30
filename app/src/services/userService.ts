import { db } from "../db";
import { user } from "../db/schemas/user";
import { eq, and, isNull } from "drizzle-orm";
import { type UpdateUserDTO } from "../lib/dtos/user.dto";
import { account } from "../db/schemas/account";
import { type TokenPayload } from "google-auth-library";
import { first } from "lodash";
import { lower } from "../db/columns.helpers";

export async function createUser(input: Omit<User, "id">) {
  return db
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
  return first(
    await db
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
      .where(eq(lower(user.email), email.toLowerCase()))
      .limit(1),
  );
}

export async function getUnVerifiedUserById(id: string) {
  return first(
    await db
      .select({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      })
      .from(user)
      .where(and(eq(user.id, id), isNull(user.emailVerified)))
      .limit(1),
  );
}

export async function verifyUser(id: string) {
  return db
    .update(user)
    .set({ emailVerified: new Date() })
    .where(eq(user.id, id));
}

export async function updateUserPassword(id: string, password: string) {
  return await db.update(user).set({ password }).where(eq(user.id, id));
}

export async function getUserById(id: string) {
  return first(
    await db
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
      .limit(1),
  );
}

export async function updateUserProfileImage(userId: string, image: string) {
  return db.update(profile).set({ image }).where(eq(user.id, userId));
}

export async function updateUser(id: string, input: UpdateUserDTO) {
  const [currentUser] = await db.select().from(user).where(eq(user.id, id));
  const isEmailChanging = input.email && input.email !== currentUser.email;
  return first(
    await db
      .update(user)
      .set({
        ...input,
        emailVerified: isEmailChanging ? null : undefined,
      })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
  );
}

export async function getAccountsByUserId(id: string) {
  return db
    .select({
      userId: account.userId,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
    })
    .from(account)
    .where(eq(account.userId, id));
}

export async function getUserByProviderAndId(provider: string, id: string) {
  return first(
    await db
      .select({ id: user.id, email: user.email })
      .from(account)
      .where(
        and(eq(account.providerAccountId, id), eq(account.provider, provider)),
      )
      .leftJoin(user, eq(user.id, account.userId))
      .limit(1),
  );
}

export async function linkAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
) {
  return db.insert(account).values({
    userId,
    provider,
    providerAccountId,
  });
}

export async function createUserByFacebook(fbUserData: FacebookUser) {
  const {
    id,
    email,
    first_name: firstName,
    last_name: lastName,
    picture,
  } = fbUserData;

  const [createdUser] = await db
    .insert(user)
    .values({
      firstName,
      lastName,
      image: picture.data.url,
      email: email,
      emailVerified: email ? new Date() : null,
    })
    .returning({ id: user.id, email: user.email });

  await linkAccount(createdUser.id, "facebook", id);

  return createdUser;
}

export async function unLinkAccount(provider: string, userId: string) {
  return db
    .delete(account)
    .where(and(eq(account.provider, provider), eq(account.userId, userId)));
}

export async function createUserByGoogle(data: TokenPayload | undefined) {
  if (!data) return null;
  const [firstName, lastName] = data.name?.split(" ") ?? [null, null];

  const [createdUser] = await db
    .insert(user)
    .values({
      firstName: firstName || data.given_name || null,
      lastName,
      image:
        data.picture ||
        `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${
          data.name || data.sub
        }`,
      email: data.email || null,
      emailVerified: data.email_verified ? new Date() : null,
    })
    .returning({ id: user.id, email: user.email });

  await linkAccount(createdUser.id, "google", data.sub);

  return createdUser;
}
