import { db } from "../db";
import { user } from "../db/schemas/user.schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
  type UpdateUserProfileDTO,
  type CreateUserInputDTO,
  type UpdateUserDTO,
} from "../dtos/user.dto";
import { account } from "../db/schemas/account.schema";
import { type TokenPayload } from "google-auth-library";
import { first } from "lodash-es";
import { lower } from "../db/helpers/time.helpers";
import { profile } from "../db/schemas/profile.schema";
import { role } from "../db/schemas/role.schema";
import { userRole } from "../db/schemas/userRole.schema";

export async function createUser(
  input: CreateUserInputDTO & Pick<Profile, "image">,
) {
  const [selectedRole] = await db
    .select()
    .from(role)
    .where(eq(role.name, input.role))
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!selectedRole) throw new Error("Role not found");

  const [createdUser] = await db
    .insert(user)
    .values({
      email: input.email,
      password: input.password,
    })
    .returning({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  await db
    .insert(userRole)
    .values({ userId: createdUser.id, roleId: selectedRole.id });

  await db
    .insert(profile)
    .values({
      userId: createdUser.id,
      firstName: input.firstName,
      lastName: input.lastName,
      image: input.image,
    })
    .returning({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      image: profile.image,
      imageBlurHash: profile.imageBlurHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  return createdUser;
}

export async function getUser(email: string) {
  return first(
    await db
      .select({
        id: user.id,
        password: user.password,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: sql<Array<Role["name"]>>`
      COALESCE(
        json_agg(${role.name}),
        '[]'
      )
    `,
      })
      .from(user)
      .leftJoin(userRole, eq(userRole.userId, user.id))
      .leftJoin(role, eq(role.id, userRole.roleId))
      .groupBy(user.id)
      .where(eq(lower(user.email), email.toLowerCase())),
  );
}

export async function getUserProfile(userId: User["id"]) {
  return first(
    await db
      .select({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        image: profile.image,
        imageBlurHash: profile.imageBlurHash,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1),
  );
}

export async function getUnVerifiedUserById(id: string) {
  return first(
    await db
      .select({
        id: user.id,
        email: user.email,
        firstName: profile.firstName,
      })
      .from(user)
      .leftJoin(profile, eq(user.id, profile.userId))
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

export async function updateUserPassword(userId: User["id"], password: string) {
  return await db.update(user).set({ password }).where(eq(user.id, userId));
}

export async function getUserById(userId: User["id"]) {
  return first(
    await db
      .select({
        id: user.id,
        email: user.email,
        password: user.password,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
  );
}

export async function updateUserProfileImage(
  userId: string,
  input: Pick<Profile, "image" | "imageBlurHash">,
) {
  return db
    .update(profile)
    .set({ image: input.image, imageBlurHash: input.imageBlurHash })
    .where(eq(profile.userId, userId));
}

export async function updateUser(userId: User["id"], input: UpdateUserDTO) {
  const [currentUser] = await db.select().from(user).where(eq(user.id, userId));
  const isEmailChanging = input.email && input.email !== currentUser.email;
  return first(
    await db
      .update(user)
      .set({
        ...input,
        emailVerified: isEmailChanging ? null : undefined,
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
  );
}

export async function updateUserProfile(
  userId: User["id"],
  input: UpdateUserProfileDTO,
) {
  return first(
    await db
      .update(profile)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        bio: input.bio,
      })
      .where(eq(profile.userId, userId))
      .returning({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        image: profile.image,
        imageBlurHash: profile.imageBlurHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
  );
}

export async function getAccountsByUserId(id: string) {
  return db.select().from(account).where(eq(account.userId, id));
}

export async function getUserByProviderAndId(
  provider: string,
  userId: User["id"],
) {
  return first(
    await db
      .select({ id: user.id, email: user.email })
      .from(account)
      .where(
        and(
          eq(account.providerAccountId, userId),
          eq(account.provider, provider),
        ),
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

export async function createUserByFacebook(
  fbUserData: FacebookUser,
  input: {
    role: CreateUserInputDTO["role"];
  },
) {
  const {
    id,
    email,
    first_name: firstName,
    last_name: lastName,
    picture,
  } = fbUserData;

  const [selectedRole] = await db
    .select()
    .from(role)
    .where(eq(role.name, input.role))
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!selectedRole) throw new Error("Role not found");

  const [createdUser] = await db
    .insert(user)
    .values({
      email: email,
      emailVerified: email ? new Date() : null,
    })
    .returning({ id: user.id, email: user.email });

  await db
    .insert(userRole)
    .values({ userId: createdUser.id, roleId: selectedRole.id });

  await db
    .insert(profile)
    .values({
      userId: createdUser.id,
      firstName,
      lastName,
      image: picture.data.url,
    })
    .returning({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      image: profile.image,
      imageBlurHash: profile.imageBlurHash,
    });

  await linkAccount(createdUser.id, "facebook", id);

  return createdUser;
}

export async function unLinkAccount(provider: string, userId: string) {
  return db
    .delete(account)
    .where(and(eq(account.provider, provider), eq(account.userId, userId)));
}

export async function createUserByGoogle(
  data: TokenPayload | undefined,
  input: {
    role: CreateUserInputDTO["role"];
  },
) {
  if (!data) throw new Error("No user data");
  const [firstName, lastName] = data.name?.split(" ") ?? [null, null];

  const [selectedRole] = await db
    .select()
    .from(role)
    .where(eq(role.name, input.role))
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!selectedRole) throw new Error("Role not found");

  const [createdUser] = await db
    .insert(user)
    .values({
      email: data.email || null,
      emailVerified: data.email_verified ? new Date() : null,
    })
    .returning({ id: user.id, email: user.email });

  await db
    .insert(userRole)
    .values({ userId: createdUser.id, roleId: selectedRole.id });

  const imageURI = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${
    data.name || data.sub
  }`;
  await db
    .insert(profile)
    .values({
      userId: createdUser.id,
      firstName: firstName ?? data.given_name ?? null,
      lastName,
      image: data.picture ?? imageURI,
    })
    .returning({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      image: profile.image,
      imageBlurHash: profile.imageBlurHash,
    });

  await linkAccount(createdUser.id, "google", data.sub);

  return createdUser;
}

export async function getUserRoles(userId: User["id"]) {
  return first(
    await db
      .select({
        roles: sql<Array<Role["name"]>>`
      COALESCE(
        json_agg(${role.name}),
        '[]'
      )
    `,
      })
      .from(userRole)
      .leftJoin(role, eq(userRole.roleId, role.id))
      .where(eq(userRole.userId, userId)),
  );
}
