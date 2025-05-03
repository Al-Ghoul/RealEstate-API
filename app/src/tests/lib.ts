import request from "supertest";
import { app } from "../app";

export const basicUser = {
  email: "johndoe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "password",
  confirmPassword: "password",
};

export const createUser = async (input: typeof basicUser) =>
  request(app)
    .post("/api/auth/register")
    .send(input)
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(201);
