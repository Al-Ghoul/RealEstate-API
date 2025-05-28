import request from "supertest";
import { app } from "../../app";
import { expect, describe, it, beforeAll } from "bun:test";
import { redisClient } from "../../utils/redis.utils";

describe("Check for properties endpoints existence", () => {
  it("POST /api/properties/ returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/properties")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("GET /api/properties returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/properties")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("GET /api/properties/:id returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/properties/1")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("PATCH /api/properties/:id returns 401 unauthorized", async () => {
    const response = await request(app)
      .patch("/api/properties/1")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("DELETE /api/properties/:id returns 401 unauthorized", async () => {
    const response = await request(app)
      .delete("/api/properties/1")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("POST /api/properties/:id/media returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/properties/1/media")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("GET /api/properties/:id/media returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/properties/1/media")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("DELETE /api/properties/:id/media/mediaId returns 401 unauthorized", async () => {
    const response = await request(app)
      .delete("/api/properties/1/media/1")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      message: "Access denied",
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
