import request from "supertest";
import { app } from "../../app";
import { expect, describe, it } from "bun:test";

describe("Check for user endpoints existence", () => {
  it("GET /api/users/me returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("PATCH /api/users/me returns 401 unauthorized", async () => {
    const response = await request(app)
      .patch("/api/users/me")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("GET /api/users/me/profile returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/users/me/profile")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("PATCH /api/users/me/profile returns 401 unauthorized", async () => {
    const response = await request(app)
      .patch("/api/users/me/profile")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });

  it("PUT /api/users/me/profile/image returns 401 unauthorized", async () => {
    const response = await request(app)
      .put("/api/users/me/profile/image")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access denied",
      details: "Please provide an authorization token",
    });
  });
});
