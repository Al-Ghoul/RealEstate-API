import { Request, Response } from "express";
import { type LoginUserDTO, type CreateUserDTO } from "../lib/dtos/users";
import * as userService from "../services/userService";
import { DatabaseError } from "pg";
import bcrypt from "bcrypt";
import { env } from "../env";
import jwt from "jsonwebtoken";

export async function registerUser(req: Request, res: Response) {
  const input = req.body as CreateUserDTO;
  const hashedPassword = await bcrypt.hash(input.password, 10);
  try {
    const user = await userService.createUser({
      ...input,
      password: hashedPassword,
    });
    res.status(201).json({
      status: "success",
      statusCode: 201,
      user: user[0],
      message: "User created successfully",
    });
    return;
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "Email or first and last names already used",
          details: "Please use a different email or first and last names",
        });
        return;
      }
    } else {
      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Database error",
        details: "Something went wrong, please try again later",
      });
      return;
    }
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { password, email } = req.body as LoginUserDTO;
    const users = await userService.getUser(email);

    if (users.length !== 0) {
      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          status: "error",
          statusCode: 401,
          message: "Invalid credentials",
        });
        return;
      }

      const accessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
        expiresIn: "1h",
        issuer: env.TOKEN_ISSUER,
      });

      const refreshToken = jwt.sign(
        { userId: user.id, type: "refresh" },
        env.JWT_SECRET,
        { expiresIn: "7d", issuer: env.TOKEN_ISSUER },
      );

      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Login successful",
        data: { accessToken, refreshToken },
      });
      return;
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
    return;
  }

  res.status(401).json({
    status: "error",
    statusCode: 401,
    message: "Invalid email or password",
    details: "Please check your email and password and try again",
  });
}
