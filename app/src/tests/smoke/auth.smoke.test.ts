import request from "supertest";
import { app } from "../../app";
import { redis } from "../../clients/redis";

describe("Check for auth endpoints existence", () => {
  it("POST /api/auth/register returns 400 with validation error", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: "Validation failed",
    });
  });

  it("POST /api/auth/login returns 400 with validation error", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: "Validation failed",
    });
  });

  it("POST /api/auth/logout returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/logout")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/refresh returns 400 with validation error", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: "Validation failed",
    });
  });

  it("POST /api/auth/request-email-verification-code returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/request-email-verification-code")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/verify returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/verify")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/request-password-reset returns 400 with validation error", async () => {
    const response = await request(app)
      .post("/api/auth/request-password-reset")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: "Validation failed",
    });
  });

  it("POST /api/auth/password-reset returns 400 with validation error", async () => {
    const response = await request(app)
      .post("/api/auth/password-reset")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: "Validation failed",
    });
  });

  it("POST /api/auth/change-password returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/change-password")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("GET /api/auth/me returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/facebook returns 400 with validation error", async () => {
    const response = await request(app)
      .post("/api/auth/facebook")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: "Validation failed",
    });
  });

  it("POST /api/auth/google returns 400 with validation error", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 400,
      message: "Validation failed",
    });
  });

  it("POST /api/auth/accounts/link returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/accounts/link")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("DELETE /api/auth/accounts/unlink/:provider with facebook returns 401 unauthorized", async () => {
    const response = await request(app)
      .delete("/api/auth/accounts/unlink/facebook")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/set-password returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/set-password")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("GET /api/auth/accounts returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/auth/accounts")
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
