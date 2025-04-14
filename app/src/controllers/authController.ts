import { Request, Response } from "express";
import { type CreateUserDTO } from "../lib/dtos/users";
import * as userService from "../services/userService";
import { DatabaseError } from "pg";
import bcrypt from "bcrypt";

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
