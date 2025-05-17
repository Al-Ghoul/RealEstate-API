import "../lib";
import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { user } from "../../db/schemas/user.schema";
import { createUser } from "../lib";
import { expect, describe, it, afterEach, beforeAll, afterAll } from "bun:test";
import { role } from "../../db/schemas/role.schema";
import { redisClient } from "../../utils/redis.utils";

const basicUser = {
  email: "johndoe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "password",
  confirmPassword: "password",
  role: "client",
};

describe("Check for user endpoints inputs and outputs ", () => {
  it("GET /api/users/me with an existing user return user's data", async () => {
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
      .get("/api/users/me")
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      message: "User was retrieved successfully",
      data: {
        id: expect.any(String),
        email: basicUser.email,
        emailVerified: null,
        hasPassword: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("PATCH /api/users/me with an existing user changes user's data", async () => {
    await createUser(basicUser);

    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResw = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const input2 = {
      email: "fj4Eo@example.com",
    };
    const userPatchRes = await request(app)
      .patch("/api/users/me")
      .send(input2)
      .set("Authorization", `Bearer ${loginResw.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(userPatchRes.body).toMatchObject({
      message: "User was updated successfully",
      data: {
        id: expect.any(String),
        email: input2.email,
        emailVerified: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("GET /api/users/me/profile with an existing user return user's data", async () => {
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
      .get("/api/users/me/profile")
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      message: "User profile was retrieved successfully",
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
    await request(app)
      .post("/api/auth/register")
      .send(basicUser)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(201);

    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const input2 = {
      firstName: "Abdo",
      lastName: "AlGhoul",
      bio: "Shame on you if you thought I'd ever leave.",
    };

    const profilePatchRes = await request(app)
      .patch("/api/users/me/profile")
      .send(input2)
      .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(profilePatchRes.body).toMatchObject({
      message: "User profile was updated successfully",
      data: {
        firstName: input2.firstName,
        lastName: input2.lastName,
        bio: input2.bio,
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
