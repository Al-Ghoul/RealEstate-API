import request from "supertest";
import { app } from "../../app";
import { expect, describe, it, beforeAll } from "bun:test";
import { redisClient } from "../../utils/redis.utils";

describe("Check for chats endpoints existence", () => {
  it("GET /api/chats/ returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/chats")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Missing authorization token",
      details: "Please provide an authorization token",
    });
  });

  it("GET /api/chats/{id}/messages returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/chats/1/messages")
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
