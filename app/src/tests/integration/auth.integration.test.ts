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

const createUser = async (input: typeof basicUser) =>
  request(app)
    .post("/api/auth/register")
    .send(input)
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(201);

// NOTE: The following endpoints need some mocks, so I won't test them yet
// /request-email-verification-code
// /verify
// /request-password-reset
// /password-reset,
// /set-password
// /accounts/unlink/:provider
// /accounts/link
// /google
// /facebook

describe("Check for auth endpoints inputs and outputs ", () => {
  it("POST /api/auth/register with valid data returns 201", async () => {
    const response = await createUser(basicUser);

    expect(response.body).toMatchObject({
      status: "success",
      statusCode: 201,
      message: "User created successfully",
      data: {
        id: expect.any(String),
        email: basicUser.email,
        firstName: basicUser.firstName,
        lastName: basicUser.lastName,
        image: expect.any(String),
        emailVerified: expect.toBeStringOrNull(),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("POST /api/auth/login with an existing user returns 200", async () => {
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

    expect(response.body).toMatchObject({
      status: "success",
      statusCode: 200,
      message: "Login successful",
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  it("POST /api/auth/refresh with a valid refresh token refreshes a user token", async () => {
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

    const refreshToken = response.body.data.refreshToken;

    const response2 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      status: "success",
      statusCode: 200,
      message: "Refreshed token successfully",
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  it("POST /api/auth/logout logs out a user", async () => {
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
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      status: "success",
      statusCode: 200,
      message: "Logout successful",
    });
  });

  it("POST /api/auth/change-password with valid data changes a user password", async () => {
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

    const input2 = {
      currentPassword: basicUser.password,
      password: "newPassword",
      confirmPassword: "newPassword",
    };
    const response2 = await request(app)
      .post("/api/auth/change-password")
      .send(input2)
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      status: "success",
      statusCode: 200,
      message: "Password was changed successfully",
    });
  });

  it("GET /api/auth/me with an existing user return user's data", async () => {
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
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      status: "success",
      statusCode: 200,
      message: "User found successfully",
      data: {
        id: expect.any(String),
        email: basicUser.email,
        firstName: basicUser.firstName,
        lastName: basicUser.lastName,
        image: expect.any(String),
        emailVerified: expect.toBeStringOrNull(),
        hasPassword: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("GET /api/auth/me/accounts with an existing user return user's accounts", async () => {
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
      .get("/api/auth/me/accounts")
      .set("Authorization", `Bearer ${response.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response2.body).toMatchObject({
      status: "success",
      statusCode: 200,
      message: "Accounts retrieved successfully",
      data: expect.any(Array),
    });
  });
});

afterEach(async () => {
  await db.delete(user).execute();
});

afterAll(async () => {
  await redis.disconnect();
});
