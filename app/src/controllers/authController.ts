import { Request, Response } from "express";
import { type CreateUserDTO } from "../lib/dtos/users.dto";
import {
  type RequestEmailCodeDTO,
  type LoginUserDTO,
  type RefreshTokenInputDTO,
} from "../lib/dtos/auth.dto";
import * as userService from "../services/userService";
import { DatabaseError } from "pg";
import bcrypt from "bcrypt";
import { env } from "../env";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import * as verificationCodeService from "../services/verificationCodeService";
import { generateCode } from "../lib/codeGenerator";
import * as mailService from "../services/mailService";
import * as notificationService from "../services/notificationService";

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

export async function refreshUserToken(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshTokenInputDTO;

  if (!refreshToken) {
    res.status(401).json({
      status: "error",
      statusCode: 401,
      message: "Invalid refresh token",
    });
    return;
  }

  try {
    const { userId, role, type } = jwt.verify(refreshToken, env.JWT_SECRET) as {
      userId: number;
      role: string;
      type: string;
      exp: number;
    };

    if (type !== "refresh") {
      res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Invalid refresh token",
      });
      return;
    }

    const accessToken = jwt.sign({ userId, role }, env.JWT_SECRET, {
      expiresIn: "1h",
      issuer: env.TOKEN_ISSUER,
    });

    const newRefreshToken = jwt.sign(
      { userId, role, type: "refresh" },
      env.JWT_SECRET,
      { expiresIn: "7d", issuer: env.TOKEN_ISSUER },
    );

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Refresh token successful",
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Invalid refresh token",
      });
      return;
    }
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
    });
    return;
  }
}

export async function requestEmailVerificationCode(req: Request, res: Response) {
  const { email } = req.body as RequestEmailCodeDTO;

  try {
    const user = (await userService.getUnVerifiedUser(email))[0];

    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found or already verified",
        details: "User with provided email not found or already verified",
      });
      return;
    }
    const verificationCode =
      (await verificationCodeService.getVerCodeByUserIdAndType(
        user.id,
        "EMAIL_VERIFICATION",
      ))[0];

    if (verificationCode) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Verification code already sent",
        details: "Please try again later",
      });
      return;
    }

    const code = generateCode();
    await verificationCodeService.createVerificationCode(
      user,
      code,
      "EMAIL_VERIFICATION",
    );

    const content = mailService.renderPugTemplate("EMAIL_VERIFICATION", {
      user,
      code,
    });

    const emailSent = await mailService.sendEmail(
      user,
      "Verify your email",
      content,
    );

    await notificationService.createNotification({
      userId: user.id,
      recipient: user.email,
      subject: "Verify your email",
      type: "EMAIL",
      message: content,
      isSent: emailSent,
    });

    if (!emailSent) {
      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Email not sent",
        details: "Please try again later",
      });
      return;
    }

    res
      .status(200)
      .json({ status: "success", statusCode: 200, message: "Email sent" });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}
