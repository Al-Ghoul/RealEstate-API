import "../lib";
import request from "supertest";
import { app } from "../../app";
import { redis } from "../../clients/redis";
import { db } from "../../db";
import { user } from "../../db/schemas/user";

const basicUser = {
  email: "johndoe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "password",
  confirmPassword: "password",
};

describe("Check for user endpoints inputs and outputs ", () => {
  it("PATCH /api/users/me with an existing user changes user's data", async () => {
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
      status: "success",
      statusCode: 200,
      message: "User was updated successfully",
      data: {
        id: expect.any(String),
        email: input2.email,
        emailVerified: expect.toBeStringOrNull(),
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
      status: "success",
      statusCode: 200,
      message: "User profile was updated successfully",
      data: {
        firstName: input2.firstName,
        lastName: input2.lastName,
        bio: input2.bio,
        image: expect.toBeStringOrNull(),
        imageBlurHash: expect.toBeStringOrNull(),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
});

afterAll(async () => {
  await redis.disconnect();
  await db.delete(user).execute();
});
