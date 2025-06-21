import request from "supertest";
import { app } from "../../app";
import { expect, describe, it, beforeAll } from "bun:test";
import { redisClient } from "../../utils/redis.utils";

describe("Check for user endpoints existence", () => {
  it("GET /api/users/me returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Missing authorization token",
      details: "Please provide an authorization token",
    });
  });

  it("PATCH /api/users/me returns 401 unauthorized", async () => {
    const response = await request(app)
      .patch("/api/users/me")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Missing authorization token",
      details: "Please provide an authorization token",
    });
  });

  it("GET /api/users/me/profile returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/users/me/profile")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Missing authorization token",
      details: "Please provide an authorization token",
    });
  });

  it("PATCH /api/users/me/profile returns 401 unauthorized", async () => {
    const response = await request(app)
      .patch("/api/users/me/profile")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Missing authorization token",
      details: "Please provide an authorization token",
    });
  });

  it("PUT /api/users/me/profile/image returns 401 unauthorized", async () => {
    const response = await request(app)
      .put("/api/users/me/profile/image")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Missing authorization token",
      details: "Please provide an authorization token",
    });
  });
});

beforeAll(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error(error);
  }
});
