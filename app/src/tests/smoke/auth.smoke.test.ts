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
      message: "Input validation failed",
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
      message: "Input validation failed",
    });
  });

  it("POST /api/auth/me/logout returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/me/logout")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/me/refresh returns 401 with unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/me/refresh")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/me/request-email-verification-code returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/me/request-email-verification-code")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/me/verify returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/me/verify")
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
      message: "Input validation failed",
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
      message: "Input validation failed",
    });
  });

  it("POST /api/auth/me/change-password returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/me/change-password")
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
      message: "Input validation failed",
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
      message: "Input validation failed",
    });
  });

  it("POST /api/auth/me/accounts/link returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/me/accounts/link")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("DELETE /api/auth/me/accounts/unlink/:provider with facebook returns 401 unauthorized", async () => {
    const response = await request(app)
      .delete("/api/auth/me/accounts/unlink/facebook")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("POST /api/auth/me/set-password returns 401 unauthorized", async () => {
    const response = await request(app)
      .post("/api/auth/me/set-password")
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toMatchObject({
      status: "error",
      statusCode: 401,
      message: "Access Denied",
      details: "Missing authorization token",
    });
  });

  it("GET /api/auth/me/accounts returns 401 unauthorized", async () => {
    const response = await request(app)
      .get("/api/auth/me/accounts")
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
