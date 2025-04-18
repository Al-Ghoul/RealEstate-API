import { Request, Response } from "express";
import { type CreateUserDTO } from "../lib/dtos/users.dto";
import {
  type RequestResetCodeDTO,
  type LoginUserDTO,
  type RefreshTokenInputDTO,
  type VerifyUserDTO,
  type PasswordResetDTO,
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
import { redis } from "../clients/redis";

export async function registerUser(req: Request, res: Response) {
  const input = req.body as CreateUserDTO;
  const hashedPassword = await bcrypt.hash(input.password, 10);
  try {
    const user = (
      await userService.createUser({
        ...input,
        password: hashedPassword,
        image: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${input.firstName}${input.lastName}`,
      })
    )[0];
    res.status(201).json({
      status: "success",
      statusCode: 201,
      user: user,
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
    const user = (await userService.getUser(email))[0];

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          status: "error",
          statusCode: 401,
          message: "Invalid credentials",
        });
        return;
      }

      const accessToken = jwt.sign(
        { id: user.id, },
        env.JWT_SECRET,
        {
          expiresIn: "1h",
          issuer: env.TOKEN_ISSUER,
        },
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
          type: "refresh",
        },
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

export async function logoutUser(req: Request, res: Response) {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] as string;
    const { exp } = jwt.decode(accessToken) as { exp: number };
    await redis.setEx(
      `blacklist:${accessToken}`,
      exp - Math.floor(Date.now() / 1000),
      "1",
    );
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Logout successful",
    });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
    return;
  }
}

export async function refreshUserToken(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshTokenInputDTO;

  if (!refreshToken) {
    res.status(403).json({
      status: "error",
      statusCode: 403,
      message: "Invalid refresh token",
    });
    return;
  }

  const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
  if (isBlacklisted) {
    res.status(403).json({
      status: "error",
      statusCode: 403,
      message: "Invalid refresh token",
    });
    return;
  }

  try {
    const { id, type, exp } = jwt.verify(
      refreshToken,
      env.JWT_SECRET,
    ) as {
      id: number;
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

    await redis.setEx(
      `blacklist:${refreshToken}`,
      exp - Math.floor(Date.now() / 1000),
      "1",
    );
    const accessToken = jwt.sign({ id, }, env.JWT_SECRET, {
      expiresIn: "1h",
      issuer: env.TOKEN_ISSUER,
    });

    const newRefreshToken = jwt.sign(
      { id, type: "refresh", },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
        issuer: env.TOKEN_ISSUER,
      },
    );

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Refreshed token successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      res.status(403).json({
        status: "error",
        statusCode: 403,
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

export async function requestEmailVerificationCode(
  req: Request,
  res: Response,
) {
  try {
    const user = (await userService.getUnVerifiedUserById(req.user!.id))[0];

    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found or already verified",
        details: "User with provided email not found or already verified",
      });
      return;
    }
    const verificationCode = (
      await verificationCodeService.getVerCodeByUserIdAndType(
        user.id,
        "EMAIL_VERIFICATION",
      )
    )[0];

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

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Email was sent successfully",
    });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function verifyUser(req: Request, res: Response) {
  const { code } = req.body as VerifyUserDTO;

  try {
    const verificationCode = (
      await verificationCodeService.getVerCodeByCodeAndType(
        code,
        "EMAIL_VERIFICATION",
      )
    )[0];

    if (!verificationCode) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Verification code not found or expired",
        details: "Please provide a valid verification code",
      });
      return;
    }

    await userService.verifyUser(verificationCode.userId!);
    await verificationCodeService.useVerificationCode(verificationCode.id);

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User verified successfully",
    });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
    return;
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  const input = req.body as RequestResetCodeDTO;

  try {
    const { email } = input;
    const user = (await userService.getUser(email))[0];

    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        details: "User with provided email not found",
      });
      return;
    }

    const verificationCode = (
      await verificationCodeService.getVerCodeByUserIdAndType(
        user.id,
        "PASSWORD_RESET",
      )
    )[0];

    if (verificationCode) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Reset code already sent",
        details: "Please try again later",
      });
      return;
    }

    const code = generateCode();
    await verificationCodeService.createVerificationCode(
      user,
      code,
      "PASSWORD_RESET",
    );

    const content = mailService.renderPugTemplate("PASSWORD_RESET", {
      user,
      code,
    });

    const emailSent = await mailService.sendEmail(
      user,
      "Password reset code",
      content,
    );
    await notificationService.createNotification({
      userId: user.id,
      recipient: user.email,
      subject: "Password reset code",
      type: "EMAIL",
      message: content,
      isSent: emailSent,
    });

    if (!emailSent) {
      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Email was not sent",
        details: "Please try again later",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Email was sent successfully",
    });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
    return;
  }
}

export async function resetUserPassword(req: Request, res: Response) {
  const input = req.body as PasswordResetDTO;
  const { code, newPassword } = input;

  try {
    const resetCode = (
      await verificationCodeService.getVerCodeByCodeAndType(
        code,
        "PASSWORD_RESET",
      )
    )[0];

    if (!resetCode || !resetCode.userId) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Reset code expired or not found",
        details: "Please provide a valid reset code",
      });
      return;
    }

    await userService.updateUserPassword(resetCode.userId, newPassword);
    await verificationCodeService.useVerificationCode(resetCode.id);

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password was reset successfully",
    });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
    return;
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const user = (await userService.getUserById(req.user!.id))[0];
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User found successfully",
      data: user,
    });
  } catch {
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
    return;
  }
}
