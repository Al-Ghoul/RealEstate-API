import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { user } from "../../db/schemas/user.schema";
import { createUser } from "../lib";
import { expect, describe, it, afterEach, beforeAll, afterAll } from "bun:test";
import { role } from "../../db/schemas/role.schema";
import { redisClient } from "../../utils/redis.utils";
import L from "../../i18n/i18n-node";
import { baseUserDTO } from "../../dtos/user.dto";
import { z } from "zod";

const basicUser = {
  email: "johndoe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "password",
  confirmPassword: "password",
  role: "CLIENT",
};

const locale = "en";

describe("Check for user endpoints inputs and outputs ", () => {
  it("GET /api/users/me with an existing user return user's data", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const getCurrentUserResponse = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const getCurrentUserData: Omit<z.infer<typeof baseUserDTO>, "password"> = {
      id: expect.any(String),
      email: basicUser.email,
      emailVerified: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(getCurrentUserResponse.body).toMatchObject({
      message: L[locale].USER_RETRIEVED_SUCCESSFULLY(),
      data: {
        ...getCurrentUserData,
        hasPassword: expect.any(Boolean),
      },
    });
  });

  it("PATCH /api/users/me with an existing user changes user's data", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const updateCurrentUserInput = {
      email: "fj4Eo@example.com",
    };
    const updateCurrentUserResponse = await request(app)
      .patch("/api/users/me")
      .send(updateCurrentUserInput)
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(updateCurrentUserResponse.body).toMatchObject({
      message: L[locale].USER_UPDATE_SUCCESS(),
      data: {
        id: expect.any(String),
        email: updateCurrentUserInput.email,
        emailVerified: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("GET /api/users/me/profile with an existing user return user's data", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const getCurrentUserProfileResponse = await request(app)
      .get("/api/users/me/profile")
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(getCurrentUserProfileResponse.body).toMatchObject({
      message: L[locale].USER_PROFILE_RETRIEVED_SUCCESSFULLY(),
      data: {
        firstName: basicUser.firstName,
        lastName: basicUser.lastName,
        bio: null,
        image: expect.any(String),
        imageBlurHash: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("PATCH /api/users/me/profile with an existing user changes user's profile", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const updateCurrentUserProfileInput = {
      firstName: "Abdo",
      lastName: "AlGhoul",
      bio: "Shame on you if you thought I'd ever leave.",
    };

    const updateCurrentUserProfileResponse = await request(app)
      .patch("/api/users/me/profile")
      .send(updateCurrentUserProfileInput)
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(updateCurrentUserProfileResponse.body).toMatchObject({
      message: L[locale].USER_PROFILE_UPDATE_SUCCESS(),
      data: {
        firstName: updateCurrentUserProfileInput.firstName,
        lastName: updateCurrentUserProfileInput.lastName,
        bio: updateCurrentUserProfileInput.bio,
        image: expect.any(String),
        imageBlurHash: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
});

beforeAll(async () => {
  await db.insert(role).values([
    {
      name: "ADMIN",
    },
    {
      name: "AGENT",
    },
    {
      name: "CLIENT",
    },
  ]);

  try {
    await redisClient.connect();
  } catch (error) {
    console.error(error);
  }
});

afterAll(async () => {
  await db.delete(role).execute();
});

afterEach(async () => {
  await db.delete(user).execute();
});
