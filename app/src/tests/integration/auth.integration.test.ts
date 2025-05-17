import "../lib";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { user } from "../../db/schemas/user.schema";
import { basicUser, createUser } from "../lib";
import { expect, describe, it, afterEach, beforeAll, afterAll } from "bun:test";
import { role } from "../../db/schemas/role.schema";
import { redisClient } from "../../utils/redis.utils";

describe("Check for auth endpoints inputs and outputs ", () => {
  it("POST /api/auth/register with valid data returns 201", async () => {
    const response = await createUser(basicUser);

    expect(response.body).toMatchObject({
      message: "Your registration was successful",
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
    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    await createUser(basicUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      message: "Login was successful",
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  it("POST /api/auth/refresh with a valid refresh token refreshes a user token", async () => {
    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    await createUser(basicUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const refreshToken = response.body.data.refreshToken;

    const response2 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      message: "Tokens refreshed successfully",
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  it("POST /api/auth/me/logout logs out a user", async () => {
    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    await createUser(basicUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const response2 = await request(app)
      .post("/api/auth/me/logout")
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      message: "Logout was successful",
    });
  });

  it("POST /api/auth/me/change-password with valid data changes a user password", async () => {
    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    await createUser(basicUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const input2 = {
      currentPassword: basicUser.password,
      password: "newPassword",
      confirmPassword: "newPassword",
    };
    const response2 = await request(app)
      .post("/api/auth/me/change-password")
      .send(input2)
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      message: "Password change was successful",
    });
  });

  it("GET /api/auth/me/accounts with an existing user return user's accounts", async () => {
    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    await createUser(basicUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const response2 = await request(app)
      .get("/api/auth/me/accounts")
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      message: "Accounts were retrieved successfully",
      data: expect.any(Array),
    });
  });
});

beforeAll(async () => {
  await db.insert(role).values([
    {
      name: "admin",
    },
    {
      name: "agent",
    },
    {
      name: "client",
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
