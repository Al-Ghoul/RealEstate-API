import request from "supertest";
import { app } from "../../app";
import { redis } from "../../clients/redis";

describe("Check for user endpoints existence", () => {
  it("PATCH /api/users/me returns 401 unauthorized", async () => {
    const response = await request(app)
      .patch("/api/users/me")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });
  
  it("PUT /api/users/me returns 401 unauthorized", async () => {
    const response = await request(app)
      .put("/api/users/me/profile-image")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });
});

afterAll(async () => {
  await redis.disconnect();
});
