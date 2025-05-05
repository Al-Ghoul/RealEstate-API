import { type Request, type Response } from "express";
import { type CreateUserDTO } from "../lib/dtos/user.dto";
import {
  type LoginUserDTO,
  type RefreshTokenInputDTO,
} from "../lib/dtos/auth.dto";
import * as userService from "../services/userService";
import { env } from "../env";
import jwt from "jsonwebtoken";
import * as verificationCodeService from "../services/verificationCodeService";
import { generateCode } from "../lib/codeGenerator";
import * as mailService from "../services/mailService";
import * as notificationService from "../services/notificationService";
import { redis } from "../clients/redis";
import {
  generateJWTTokens,
  getFacebookUserData,
  getGoogleUserData,
} from "../lib/auth";
import { assertAuthenticated } from "../lib/assertions";
import { type VerifyUserDTO } from "../lib/dtos/verify.dto";
import { type RequestResetCodeDTO } from "../lib/dtos/reset.dto";
import {
  type SetPasswordDTO,
  type ChangePasswordDTO,
  type PasswordResetDTO,
} from "../lib/dtos/password.dto";
import {
  type UnlinkAccountDTO,
  type LinkAccountDTO,
  type LoginWithFacebookDTO,
  type LoginWithGoogleDTO,
} from "../lib/dtos/account.dto";
import pg from "pg";
import { EMAIL_VERIFICATION, PASSWORD_RESET } from "../lib/templates";
import pug from "pug";
import { logger } from "../lib/logger";

const { DatabaseError } = pg;
const JsonWebTokenError = jwt.JsonWebTokenError;

export async function registerUser(req: Request, res: Response) {
  const input = req.body as CreateUserDTO;
  input.password = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 4,
  });
  try {
    const imageURI = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${input.firstName}${input.lastName}`;
    const user = await userService.createUser({
      ...input,
      image: imageURI,
    });

    logger.info({
      route: req.originalUrl,
      message: "User was created successfully",
      info: {
        requestId: req.id,
        userId: user.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      data: user,
      message: "User was created successfully",
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        logger.warn({
          route: req.originalUrl,
          message: `User with this email already exists`,
          info: {
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "Email already used",
          details: "Please use a different email",
        });

        return;
      }
    }

    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        requestId: req.id,
        error: error,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function loginUser(req: Request, res: Response) {
  const { password, email } = req.body as LoginUserDTO;
  try {
    const user = await userService.getUser(email);

    if (!user) {
      logger.warn({
        route: req.originalUrl,
        message: "User tried to login with invalid credentials",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Invalid credentials",
        details: "Please check your email and password and try again",
      });
      return;
    }

    if (!user.password) {
      logger.warn({
        route: req.originalUrl,
        message: "User has no password",
        info: {
          requestId: req.id,
          userId: user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      const accounts = await userService.getAccountsByUserId(user.id);
      if (accounts.length > 0) {
        res.status(403).json({
          status: "error",
          statusCode: 403,
          message:
            "This user is associated with a social login and has no password",
          details:
            "Please sign in with your social provider (e.g. Google, Facebook)",
        });
      }

      return;
    }

    const isPasswordValid = await Bun.password.verify(password, user.password);

    if (!isPasswordValid) {
      logger.warn({
        route: req.originalUrl,
        message: "User tried to login with invalid credentials",
        info: {
          requestId: req.id,
          userId: user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Invalid credentials",
        details: "Please check your email and password and try again",
      });

      return;
    }

    logger.info({
      route: req.originalUrl,
      message: "User logged in successfully",
      info: {
        userId: user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Login was successful",
      data: generateJWTTokens(user.id),
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function refreshUserToken(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshTokenInputDTO;

  try {
    const { header, payload } = jwt.verify(refreshToken, env.JWT_SECRET, {
      issuer: env.TOKEN_ISSUER,
      audience: env.TOKEN_AUDIENCE,
      complete: true,
    });
    const { kid } = header;
    const { sub, token_type, exp } = payload as jwt.JwtPayload;

    if (token_type !== "refresh" || !exp || !sub || !kid) {
      logger.warn({
        route: req.originalUrl,
        message: "Invalid refresh token",
        info: {
          requestId: req.id,
          userId: sub,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Invalid refresh token",
        details: "Please provide a valid refresh token",
      });

      return;
    }

    const isBlacklisted = await redis.get(`blacklist:${kid}`);
    if (isBlacklisted) {
      logger.warn({
        route: req.originalUrl,
        message: "Refresh token is blacklisted",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Refresh token is revoked",
        details: "Please provide a valid refresh token",
      });

      return;
    }

    // TODO: blacklist the associated access token
    await redis.setEx(
      `blacklist:${kid}`,
      exp - Math.floor(Date.now() / 1000),
      "1",
    );

    logger.info({
      route: req.originalUrl,
      message: "Tokens were refreshed successfully",
      info: {
        requestId: req.id,
        userId: sub,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Tokens were refreshed successfully",
      data: generateJWTTokens(sub),
    });
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      logger.warn({
        route: req.originalUrl,
        message: "Invalid refresh token",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Invalid refresh token",
        details: "Please provide a valid refresh token",
      });

      return;
    }

    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] as string;
    const { header, payload } = jwt.verify(accessToken, env.JWT_SECRET, {
      issuer: env.TOKEN_ISSUER,
      audience: env.TOKEN_AUDIENCE,
      complete: true,
    });
    const { kid } = header;
    const { sub, token_type, exp } = payload as jwt.JwtPayload;

    if (token_type !== "access" || !sub || !kid || !exp) {
      logger.warn({
        route: req.originalUrl,
        message: "Invalid access token",
        info: {
          requestId: req.id,
          userId: sub,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Invalid access token",
        details: "Please provide a valid access token",
      });

      return;
    }

    await redis.setEx(
      `blacklist:${kid}`,
      exp - Math.floor(Date.now() / 1000),
      "1",
    );

    logger.info({
      route: req.originalUrl,
      message: "Logout was successful",
      info: {
        userId: sub,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Logout was successful",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function requestEmailVerificationCode(
  req: Request,
  res: Response,
) {
  assertAuthenticated(req);

  try {
    const user = await userService.getUnVerifiedUserById(req.user.id);

    if (!user) {
      logger.warn({
        route: req.originalUrl,
        message: "User not found or already verified",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(409).json({
        status: "error",
        statusCode: 409,
        message: "User already verified",
        details: "Can not send a verification code to a verified user",
      });

      return;
    }

    if (!user.email) {
      logger.warn({
        route: req.originalUrl,
        message: "User does not have an email",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User does not have an email",
        details: "Please set your email to request a verification code",
      });

      return;
    }

    const verificationCode =
      await verificationCodeService.getVerCodeByUserIdAndType(
        user.id,
        "EMAIL_VERIFICATION",
      );
    if (verificationCode) {
      logger.warn({
        route: req.originalUrl,
        message: "Verification code already sent",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

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

    const compiledFunction = pug.compile(EMAIL_VERIFICATION);
    const htmlContent = compiledFunction({ user, code });

    const emailSent = await mailService.sendEmail(
      user,
      "Verify your email",
      htmlContent,
    );

    await notificationService.createNotification({
      userId: user.id,
      recipient: user.email,
      subject: "Verify your email",
      type: "EMAIL",
      message: htmlContent,
      isSent: emailSent,
    });

    if (!emailSent) {
      logger.error({
        route: req.originalUrl,
        message: "Verification code email could not be sent",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(503).json({
        status: "error",
        statusCode: 503,
        message: "Verification code email could not be sent",
        details: "Please try again later",
      });

      await verificationCodeService.deleteVerificationCodeByCode(code);
      return;
    }

    logger.info({
      route: req.originalUrl,
      message: "Verification code was sent",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Verification code was sent successfully",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        userId: req.user.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

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

  assertAuthenticated(req);

  try {
    const verificationCode =
      await verificationCodeService.getVerCodeByCodeAndType(
        code,
        "EMAIL_VERIFICATION",
      );
    if (!verificationCode) {
      logger.warn({
        route: req.originalUrl,
        message: "Invalid or expired verification code",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(422).json({
        status: "error",
        statusCode: 422,
        message: "Invalid or expired verification code",
        details: "Please provide a valid verification code",
      });

      return;
    }

    await userService.verifyUser(verificationCode.userId);
    await verificationCodeService.useVerificationCode(verificationCode.id);

    logger.info({
      route: req.originalUrl,
      message: "User was verified successfully",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User was verified successfully",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        userId: req.user.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  const input = req.body as RequestResetCodeDTO;

  try {
    const { email } = input;
    const user = await userService.getUser(email);

    if (!user) {
      logger.warn({
        route: req.originalUrl,
        message: "User does not exist",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(200).json({
        status: "success",
        statusCode: 200,
        message:
          "If email exists in our records, a password reset code will be sent",
      });

      return;
    }

    if (!user.email) {
      logger.warn({
        route: req.originalUrl,
        message: "User does not have an email",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User does not have an email",
        details: "Please set your email to request a verification code",
      });

      return;
    }

    const verificationCode =
      await verificationCodeService.getVerCodeByUserIdAndType(
        user.id,
        "PASSWORD_RESET",
      );
    if (verificationCode) {
      logger.warn({
        route: req.originalUrl,
        message: "Reset code already sent",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

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

    const compiledFunction = pug.compile(PASSWORD_RESET);
    const htmlContent = compiledFunction({ user, code });

    const emailSent = await mailService.sendEmail(
      user,
      "Password reset code",
      htmlContent,
    );
    await notificationService.createNotification({
      userId: user.id,
      recipient: user.email,
      subject: "Password reset code",
      type: "EMAIL",
      message: htmlContent,
      isSent: emailSent,
    });

    if (!emailSent) {
      logger.error({
        route: req.originalUrl,
        message: "Password reset email was not sent",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(503).json({
        status: "error",
        statusCode: 503,
        message: "Password reset email was not sent",
        details: "Please try again later",
      });

      await verificationCodeService.deleteVerificationCodeByCode(code);
      return;
    }

    logger.info({
      route: req.originalUrl,
      message: "Password reset code was sent successfully",
      info: {
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message:
        "If email exists in our records, a password reset code will be sent",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function resetUserPassword(req: Request, res: Response) {
  const input = req.body as PasswordResetDTO;

  try {
    const resetCode = await verificationCodeService.getVerCodeByCodeAndType(
      input.code,
      "PASSWORD_RESET",
    );
    if (!resetCode) {
      logger.warn({
        route: req.originalUrl,
        message: "Reset code expired or not found",
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid or expired reset code",
        details: "Please provide a valid reset code",
      });

      return;
    }

    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 4,
    });
    await userService.updateUserPassword(resetCode.userId, hashedPassword);
    await verificationCodeService.useVerificationCode(resetCode.id);

    logger.info({
      route: req.originalUrl,
      message: "Password was reset successfully",
      info: {
        requestId: req.id,
        userId: resetCode.userId,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password was reset successfully",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function changePassword(req: Request, res: Response) {
  assertAuthenticated(req);
  const input = req.body as ChangePasswordDTO;
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      logger.warn({
        route: req.originalUrl,
        message: "User was not found",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      throw new Error("User was not found");
    }

    if (!user.password) {
      logger.warn({
        route: req.originalUrl,
        message: "User has no password",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Password is not set",
        details: "Please set your password",
      });

      return;
    }

    const passwordMatch = await Bun.password.verify(
      input.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      logger.warn({
        route: req.originalUrl,
        message: "Password is incorrect",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Password is incorrect",
        details: "PLease provide correct password",
      });

      return;
    }

    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 4,
    });
    await userService.updateUserPassword(req.user.id, hashedPassword);

    logger.info({
      route: req.originalUrl,
      message: "Password was changed successfully",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password was changed successfully",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        userId: req.user.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function setPassword(req: Request, res: Response) {
  assertAuthenticated(req);
  const input = req.body as SetPasswordDTO;
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      logger.warn({
        route: req.originalUrl,
        message: "User was not found",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      throw new Error("User was not found");
    }

    if (user.password) {
      logger.warn({
        route: req.originalUrl,
        message: "User already has a password",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(409).json({
        status: "error",
        statusCode: 409,
        message: "User already has a password",
        details: "Please try again later",
      });

      return;
    }
    const password = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 4,
    });
    await userService.updateUserPassword(req.user.id, password);

    logger.info({
      route: req.originalUrl,
      message: "Password was set successfully",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password was set successfully",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        userId: req.user.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function loginWithFacebook(req: Request, res: Response) {
  const { accessToken } = req.body as LoginWithFacebookDTO;
  try {
    const fbUserData = await getFacebookUserData(accessToken);
    {
      const user = await userService.getUserByProviderAndId(
        "facebook",
        fbUserData.id,
      );

      if (user) {
        logger.info({
          route: req.originalUrl,
          message: "User has logged in using facebook successfully",
          info: {
            userId: user.id,
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(200).json({
          status: "success",
          statusCode: 200,
          message: "User has logged in successfully",
          data: generateJWTTokens(user.id as string),
        });

        return;
      }
    }

    const user = await userService.createUserByFacebook(fbUserData);

    logger.info({
      route: req.originalUrl,
      message: "User was created and logged in using facebook successfully",
      info: {
        userId: user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "User was created and logged in successfully",
      data: generateJWTTokens(user.id),
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        logger.warn({
          route: req.originalUrl,
          message:
            "The associated email with this facebook account is already in use",
          info: {
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "The associated email is already in use",
          details: "Please use another account",
        });

        return;
      }
    }

    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function loginWithGoogle(req: Request, res: Response) {
  const { idToken } = req.body as LoginWithGoogleDTO;
  try {
    const googleUserData = await getGoogleUserData(idToken);
    {
      const user = await userService.getUserByProviderAndId(
        "google",
        googleUserData?.sub as string,
      );

      if (user) {
        logger.info({
          route: req.originalUrl,
          message: "User has logged in using google successfully",
          info: {
            userId: user.id,
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(200).json({
          status: "error",
          statusCode: 200,
          message: "User has logged in successfully",
          data: generateJWTTokens(user.id as string),
        });

        return;
      }
    }

    const user = await userService.createUserByGoogle(googleUserData);

    logger.info({
      route: req.originalUrl,
      message: "User was created and logged in using google successfully",
      info: {
        userId: user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "User was created and logged in successfully",
      data: generateJWTTokens(user.id),
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        logger.warn({
          route: req.originalUrl,
          message:
            "The associated account with this google account is already in use",
          info: {
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "The associated account is already in use",
          details: "Please use another account",
        });

        return;
      }
    }

    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function linkAccount(req: Request, res: Response) {
  assertAuthenticated(req);
  const input = req.body as LinkAccountDTO;
  const { provider } = input;
  let providerAccountId = null;
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      logger.warn({
        route: req.originalUrl,
        message: "User was not found",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      throw new Error("User was not found");
    }

    if (provider === "facebook") {
      const fbUserData = await getFacebookUserData(input.accessToken);
      providerAccountId = fbUserData.id;
    } else {
      const data = await getGoogleUserData(input.idToken);
      if (!data) {
        logger.warn({
          route: req.originalUrl,
          message: `Account with ${provider} as a provider could not be linked`,
          info: {
            requestId: req.id,
            userId: req.user.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Account could not be linked",
          details: "Please try again later",
        });

        return;
      }
      providerAccountId = data.sub;
    }
    const account = await userService.linkAccount(
      user.id,
      provider,
      providerAccountId,
    );

    logger.info({
      route: req.originalUrl,
      message: `User with ${provider} as a provider was created linked successfully`,
      info: {
        userId: user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Account was linked successfully",
      data: account,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      logger.warn({
        route: req.originalUrl,
        message: `Account with ${provider} as a provider could not be linked`,
        info: {
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
      if (error.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "The associated account is already in use",
          details: "Please use another account",
        });

        return;
      }
    }

    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function unlinkAccount(req: Request, res: Response) {
  assertAuthenticated(req);
  const { provider } = req.params as UnlinkAccountDTO;
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      logger.warn({
        route: req.originalUrl,
        message: "User was not found",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      throw new Error("User was not found");
    }

    if (!user.password) {
      logger.warn({
        route: req.originalUrl,
        message: "User has no password",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Password is not set",
        details: "Please set your password to unlink your account",
      });

      return;
    }
    const account = await userService.unLinkAccount(provider, req.user.id);
    if (!account.rowCount) {
      logger.warn({
        route: req.originalUrl,
        message: `Account with ${provider} as a provider was not found`,
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Account was not found",
        details: "Please try with another account",
      });

      return;
    }

    logger.info({
      route: req.originalUrl,
      message: `Account with ${provider} as a provider was unlinked successfully`,
      info: {
        userId: user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Account was unlinked successfully",
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        error: error,
        requestId: req.id,
        userId: req.user.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function getAccounts(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const accounts = await userService.getAccountsByUserId(req.user.id);
    logger.info({
      route: req.originalUrl,
      message: "Accounts were retrieved successfully",
      info: {
        requestId: req.id,
        userId: req.user.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Accounts were retrieved successfully",
      data: accounts,
    });
  } catch (error) {
    logger.error({
      route: req.originalUrl,
      message: "Internal server error",
      info: {
        requestId: req.id,
        userId: req.user.id,
        error: error,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}
