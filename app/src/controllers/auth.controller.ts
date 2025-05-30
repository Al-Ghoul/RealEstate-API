import { type Request, type Response } from "express";
import { type CreateUserInputDTO } from "../dtos/user.dto";
import {
  type CodeInputDTO,
  type LoginUserInputDTO,
  type RefreshTokenInputDTO,
} from "../dtos/auth.dto";
import * as userService from "../services/user.service";
import { env } from "../config/env.config";
import jwt from "jsonwebtoken";
import * as verificationCodeService from "../services/verification.service";
import { generateCode } from "../utils/code.utils";
import * as mailService from "../services/mail.service";
import * as notificationService from "../services/notification.service";
import { redisClient } from "../utils/redis.utils";
import {
  generateJWTTokens,
  getFacebookUserData,
  getGoogleUserData,
} from "../utils/auth.utils";
import { assertAuthenticated } from "../utils/assertions.utils";
import { type RequestResetCodeDTO } from "../dtos/auth.dto";
import {
  type UnlinkAccountInputDTO,
  type LinkAccountDTO,
} from "../dtos/account.dto";
import {
  type SetPasswordInputDTO,
  type ChangePasswordInputDTO,
  type PasswordResetInputDTO,
  type LoginWithFacebookDTO,
  type LoginWithGoogleDTO,
} from "../dtos/auth.dto";
import pg from "pg";
import { PASSWORD_RESET } from "../views/emails/passwordReset.view";
import { EMAIL_VERIFICATION } from "../views/emails/emailVerification.view";
import pug from "pug";
import { logger } from "../utils/logger.utils";
import L from "../i18n/i18n-node";
import type { Locales } from "../i18n/i18n-types";

const { DatabaseError } = pg;
const JsonWebTokenError = jwt.JsonWebTokenError;

export async function registerUser(req: Request, res: Response) {
  const lang = req.locale.language as Locales;
  const input = req.body as CreateUserInputDTO;
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
      data: user,
      message: L[lang].REIGSTER_SUCCESS(),
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        logger.warn({
          route: req.originalUrl,
          message: "User with this email already exists",
          info: {
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(409).json({
          requestId: req.id,
          message: L[lang].EMAIL_ALREADY_USED(),
          details: L[lang].EMAIL_ALREADY_USED_DETAILS(),
        });

        return;
      }
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function loginUser(req: Request, res: Response) {
  const lang = req.locale.language as Locales;
  const { password, email } = req.body as LoginUserInputDTO;

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
        requestId: req.id,
        message: L[lang].INVALID_CREDENTIALS(),
        details: L[lang].INVALID_CREDENTIALS_DETAILS(),
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
          requestId: req.id,
          message: L[lang].USER_CAN_ONLY_LOGIN_WITH_LINKED_ACCOUNT,
          details: L[lang].USER_CAN_ONLY_LOGIN_WITH_LINKED_ACCOUNT_DETAILS(),
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
        requestId: req.id,
        message: L[lang].INVALID_CREDENTIALS(),
        details: L[lang].INVALID_CREDENTIALS_DETAILS(),
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
      message: L[lang].LOGIN_SUCCESS(),
      data: generateJWTTokens(user.id, user.roles),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function refreshUserToken(req: Request, res: Response) {
  const lang = req.locale.language as Locales;
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
        requestId: req.id,
        message: L[lang].INVALID_REFRESH_TOKEN(),
        details: L[lang].INVALID_REFRESH_TOKEN_DETAILS(),
      });

      return;
    }

    try {
      const isBlacklisted = await redisClient.get(`blacklist:${kid}`);
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
          requestId: req.id,
          message: L[lang].REVOKED_REFRESH_TOKEN(),
          details: L[lang].REVOKED_REFRESH_TOKEN_DETAILS(),
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error({
          router: req.originalUrl,
          message: "Redis client error",
          info: {
            requestId: req.id,
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });
      } else {
        logger.error({
          router: req.originalUrl,
          message: "Redis client error",
          info: {
            requestId: req.id,
            error,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });
      }

      res.status(500).json({
        requestId: req.id,
        message: L[lang].INTERNAL_SERVER_ERROR(),
        details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
      });
      return;
    }

    // TODO: blacklist the associated access token
    await redisClient.set(`blacklist:${kid}`, "1");
    await redisClient.expire(
      `blacklist:${kid}`,
      exp - Math.floor(Date.now() / 1000),
    );

    const roles = await userService.getUserRoles(sub);

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
      message: L[lang].TOKENS_REFRESHED_SUCCESSFULLY(),
      data: generateJWTTokens(sub, roles?.roles),
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
        requestId: req.id,
        message: L[lang].INVALID_REFRESH_TOKEN(),
        details: L[lang].INVALID_REFRESH_TOKEN_DETAILS(),
      });

      return;
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  const lang = req.locale.language as Locales;

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
        requestId: req.id,
        message: L[lang].INVALID_ACCESS_TOKEN(),
        details: L[lang].INVALID_ACCESS_TOKEN_DETAILS(),
      });

      return;
    }

    await redisClient.set(`blacklist:${kid}`, "1");
    await redisClient.expire(
      `blacklist:${kid}`,
      exp - Math.floor(Date.now() / 1000),
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
      message: L[lang].LOGOUT_SUCCESS(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function requestEmailVerificationCode(
  req: Request,
  res: Response,
) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;

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
        requestId: req.id,
        message: L[lang].CAN_NOT_SEND_VERIFICATION_CODE(),
        details: L[lang].USER_ALREADY_VERIFIED_DETAILS(),
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
        requestId: req.id,
        message: L[lang].USER_DOES_NOT_HAVE_AN_EMAIL(),
        details: L[lang].USER_DOES_NOT_HAVE_AN_EMAIL_DETAILS(),
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
        requestId: req.id,
        message: L[lang].VERIFICATION_CODE_ALREADY_SENT(),
        details: L[lang].VERIFICATION_CODE_ALREADY_SENT_DETAILS(),
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
        requestId: req.id,
        message: L[lang].VERIFICATION_CODE_COULD_NOT_BE_SENT(),
        details: L[lang].VERIFICATION_CODE_COULD_NOT_BE_SENT_DETAILS(),
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
      message: L[lang].VERIFICATION_CODE_SENT_SUCCESSFULLY(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function verifyUser(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const { code } = req.body as CodeInputDTO;

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
        requestId: req.id,
        message: L[lang].INVALID_OR_EXPIRED_VERIFICATION_CODE(),
        details: L[lang].INVALID_OR_EXPIRED_VERIFICATION_CODE_DETAILS(),
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
      message: L[lang].USER_VERIFICATION_SUCCESS(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  const lang = req.locale.language as Locales;
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
        message: L[lang].PASSWORD_RESET_CODE_SENT_SUCCESSFULLY(),
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
        message: L[lang].USER_DOES_NOT_HAVE_AN_EMAIL(),
        details: L[lang].USER_DOES_NOT_HAVE_AN_EMAIL_DETAILS(),
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
        message: L[lang].PASSWORD_RESET_CODE_ALREADY_SENT(),
        details: L[lang].PASSWORD_RESET_CODE_ALREADY_SENT_DETAILS(),
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
        requestId: req.id,
        message: L[lang].PASSWORD_RESET_CODE_COULD_NOT_BE_SENT(),
        details: L[lang].PASSWORD_RESET_CODE_COULD_NOT_BE_SENT_DETAILS(),
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
      message: L[lang].PASSWORD_RESET_CODE_SENT_SUCCESSFULLY(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function resetUserPassword(req: Request, res: Response) {
  const lang = req.locale.language as Locales;
  const input = req.body as PasswordResetInputDTO;

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
        requestId: req.id,
        message: L[lang].INVALID_OR_EXPIRED_PASSWORD_RESET_CODE(),
        details: L[lang].INVALID_OR_EXPIRED_PASSWORD_RESET_CODE_DETAILS(),
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
      message: L[lang].PASSWORD_RESET_SUCCESS(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function changePassword(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;

  const input = req.body as ChangePasswordInputDTO;
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
        requestId: req.id,
        message: L[lang].PASSWORD_NOT_SET(),
        details: L[lang].PASSWORD_NOT_SET_DETAILS(),
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
        message: L[lang].PASSWORD_INCORRECT(),
        details: L[lang].PASSWORD_INCORRECT_DETAILS(),
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
      message: L[lang].PASSWORD_CHANGE_SUCCESS(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function setPassword(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const input = req.body as SetPasswordInputDTO;
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
        requestId: req.id,
        message: L[lang].PASSWORD_ALREADY_SET(),
        details: L[lang].PASSWORD_ALREADY_SET_DETAILS(),
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
      message: L[lang].PASSWORD_SET_SUCCESS(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function loginWithFacebook(req: Request, res: Response) {
  const lang = req.locale.language as Locales;
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
          message: L[lang].LOGIN_SUCCESS(),
          data: generateJWTTokens(user.id as string, user.roles),
        });

        return;
      }
    }

    const user = await userService.createUserByFacebook(fbUserData, {
      role: "CLIENT",
    });

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
      message: L[lang].USER_CREATED_AND_LOGGED_IN_SUCCESSFULLY(),
      data: generateJWTTokens(user.id, ["CLIENT"]),
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
          requestId: req.id,
          message: L[lang].ASSOCIATED_EMAIL_ALREADY_USED(),
          details: L[lang].ASSOCIATED_EMAIL_ALREADY_USED_DETAILS(),
        });

        return;
      }
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function loginWithGoogle(req: Request, res: Response) {
  const lang = req.locale.language as Locales;
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
          message: L[lang].LOGIN_SUCCESS(),
          data: generateJWTTokens(user.id as string, user.roles),
        });

        return;
      }
    }

    const user = await userService.createUserByGoogle(googleUserData, {
      role: "CLIENT",
    });

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
      message: L[lang].USER_CREATED_AND_LOGGED_IN_SUCCESSFULLY(),
      data: generateJWTTokens(user.id, ["CLIENT"]),
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
          requestId: req.id,
          message: L[lang].ASSOCIATED_EMAIL_ALREADY_USED(),
          details: L[lang].ASSOCIATED_EMAIL_ALREADY_USED_DETAILS(),
        });

        return;
      }
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function linkAccount(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
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
          message: L[lang].ACCOUNT_COULD_NOT_BE_LINKED(),
          details: L[lang].ACCOUNT_COULD_NOT_BE_LINKED_DETAILS(),
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
      message: L[lang].ACCOUNT_LINK_SUCCESS(),
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
          message: "The associated account is already in use",
          details: "Please use another account",
        });

        return;
      }
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function unlinkAccount(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const { provider } = req.params as UnlinkAccountInputDTO;
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
        requestId: req.id,
        message: L[lang].PASSWORD_NOT_SET(),
        details: L[lang].PASSWORD_NOT_SET_DETAILS(),
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
        requestId: req.id,
        message: L[lang].ACCOUNT_NOT_FOUND(),
        details: null,
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
      message: L[lang].ACCOUNT_UNLINK_SUCCESS(),
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}

export async function getAccounts(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
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
      message: L[lang].ACCOUNTS_RETRIEVED_SUCCESSFULLY(),
      data: accounts,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
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
    }

    res.status(500).json({
      requestId: req.id,
      message: L[lang].INTERNAL_SERVER_ERROR(),
      details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
    });
  }
}
