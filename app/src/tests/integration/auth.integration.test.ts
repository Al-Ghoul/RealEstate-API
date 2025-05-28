import "../lib";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { user } from "../../db/schemas/user.schema";
import { basicUser, createUser } from "../lib";
import { expect, describe, it, afterEach, beforeAll, afterAll } from "bun:test";
import { role } from "../../db/schemas/role.schema";
import { redisClient } from "../../utils/redis.utils";
import L from "../../i18n/i18n-node";

const locale = "en";
describe("Check for auth endpoints inputs and outputs ", () => {
  it("POST /api/auth/register with valid data returns 201", async () => {
    const createUserResponse = await createUser(basicUser);

    expect(createUserResponse.body).toMatchObject({
      message: L[locale].REIGSTER_SUCCESS(),
      data: {
        id: expect.any(String),
        email: basicUser.email,
        emailVerified: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("POST /api/auth/login with an existing user returns 200", async () => {
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

    expect(userLoginResponse.body).toMatchObject({
      message: L[locale].LOGIN_SUCCESS(),
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  it("POST /api/auth/refresh with a valid refresh token refreshes a user token", async () => {
    await createUser(basicUser);
    const userLoginPut = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginPut)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const refreshToken = userLoginResponse.body.data.refreshToken;

    const refreshTokensResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(refreshTokensResponse.body).toMatchObject({
      message: L[locale].TOKENS_REFRESHED_SUCCESSFULLY(),
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  it("POST /api/auth/me/logout logs out a user", async () => {
    await createUser(basicUser);
    const useLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send(useLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const userLogoutResponse = await request(app)
      .post("/api/auth/me/logout")
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(userLogoutResponse.body).toMatchObject({
      message: L[locale].LOGOUT_SUCCESS(),
    });
  });

  it("POST /api/auth/me/change-password with valid data changes a user password", async () => {
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

    const updateUserPasswordINput = {
      currentPassword: basicUser.password,
      password: "newPassword",
      confirmPassword: "newPassword",
    };
    const updateCurrentUserPasswordResponse = await request(app)
      .post("/api/auth/me/change-password")
      .send(updateUserPasswordINput)
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(updateCurrentUserPasswordResponse.body).toMatchObject({
      message: L[locale].PASSWORD_CHANGE_SUCCESS(),
    });
  });

  it("GET /api/auth/me/accounts with an existing user return user's accounts", async () => {
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

    const getCurrentUserAccountsResponse = await request(app)
      .get("/api/auth/me/accounts")
      .set("Authorization", `Bearer ${userLoginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(getCurrentUserAccountsResponse.body).toMatchObject({
      message: L[locale].ACCOUNTS_RETRIEVED_SUCCESSFULLY(),
      data: [],
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
