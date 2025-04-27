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
    const input = {
      email: basicUser.email,
      password: basicUser.password,
    };
    await request(app)
      .post("/api/auth/register")
      .send(basicUser)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(201);

    const response = await request(app)
      .post("/api/auth/login")
      .send(input)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const input2 = {
      firstName: "Abdo",
      lastName: "AlGhoul",
    };
    const response2 = await request(app)
      .patch("/api/users/me")
      .send(input2)
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      status: "success",
      statusCode: 200,
      message: "User updated successfully",
      data: {
        id: expect.any(String),
        email: basicUser.email,
        firstName: input2.firstName,
        lastName: input2.lastName,
        image: expect.any(String),
        emailVerified: expect.toBeStringOrNull(),
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
