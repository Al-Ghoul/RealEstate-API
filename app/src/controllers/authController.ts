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
    res.status(201).json({
      status: "success",
      statusCode: 201,
      data: user,
      message: "User was created successfully",
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "Email already used",
          details: "Please use a different email",
        });
        return;
      }
      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Unidentified database error",
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
    const user = await userService.getUser(email);

    if (user) {
      if (!user.password) {
        const accounts = await userService.getAccountsByUserId(user.id);
        if (accounts.length > 0) {
          res.status(403).json({
            status: "error",
            statusCode: 403,
            message:
              "This user is associated with a social login. Please sign in with your social provider (e.g., Google, Facebook)",
            details:
              "Please sign in with your social provider (e.g. Google, Facebook)",
          });
        }
        return;
      }

      const isPasswordValid = await Bun.password.verify(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        res.status(401).json({
          status: "error",
          statusCode: 401,
          message: "Invalid credentials",
          details: "Please check your email and password and try again",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Login was successful",
        data: generateJWTTokens(user),
      });
      return;
    }
  } catch {
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
    message: "Invalid credentials",
    details: "Please check your email and password and try again",
  });
}

export async function refreshUserToken(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshTokenInputDTO;

  const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
  if (isBlacklisted) {
    res.status(403).json({
      status: "error",
      statusCode: 403,
      message: "Refresh token is blacklisted",
      details: "Please provide a valid refresh token",
    });
    return;
  }

  try {
    const { id, type, exp } = jwt.verify(refreshToken, env.JWT_SECRET) as {
      id: string;
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

    // TODO: blacklist the associated access token
    await redis.setEx(
      `blacklist:${refreshToken}`,
      exp - Math.floor(Date.now() / 1000),
      "1",
    );

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Tokens were refreshed successfully",
      data: generateJWTTokens({ id }),
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
  }
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
      message: "Logout was successful",
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

export async function requestEmailVerificationCode(
  req: Request,
  res: Response,
) {
  assertAuthenticated(req);

  try {
    const user = await userService.getUnVerifiedUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found or already verified",
        details: "User with provided email not found or already verified",
      });
      return;
    }

    if (!user.email) {
      res.status(403).json({
        status: "error",
        statusCode: 403,
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
        message: "Verification code could not be sent",
        details: "Please try again later",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Verification code was sent",
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
    const verificationCode =
      await verificationCodeService.getVerCodeByCodeAndType(
        code,
        "EMAIL_VERIFICATION",
      );
    if (!verificationCode) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Invalid or expired verification code",
        details: "Please provide a valid verification code",
      });
      return;
    }

    await userService.verifyUser(verificationCode.userId);
    await verificationCodeService.useVerificationCode(verificationCode.id);

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User was verified successfully",
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

export async function requestPasswordReset(req: Request, res: Response) {
  const input = req.body as RequestResetCodeDTO;

  try {
    const { email } = input;
    const user = await userService.getUser(email);

    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        details: "User with provided email not found",
      });
      return;
    }

    if (!user.email) {
      res.status(403).json({
        status: "error",
        statusCode: 403,
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
      message: "Password reset code was sent successfully",
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

export async function resetUserPassword(req: Request, res: Response) {
  const input = req.body as PasswordResetDTO;

  try {
    const resetCode = await verificationCodeService.getVerCodeByCodeAndType(
      input.code,
      "PASSWORD_RESET",
    );
    if (!resetCode) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Reset code expired or not found",
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
  }
}

export async function changePassword(req: Request, res: Response) {
  assertAuthenticated(req);
  const input = req.body as ChangePasswordDTO;
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User was not found",
        details: "User with provided id not found",
      });
      return;
    }

    if (!user.password) {
      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "User has no password",
        details: "Please set your password",
      });
      return;
    }

    const passwordMatch = await Bun.password.verify(
      input.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Password is incorrect",
        details: "Please try again later",
      });
      return;
    }

    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 4,
    });
    await userService.updateUserPassword(req.user.id, hashedPassword);
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password was changed successfully",
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

export async function setPassword(req: Request, res: Response) {
  assertAuthenticated(req);
  const input = req.body as SetPasswordDTO;
  try {
    const user = await userService.getUserById(req.user.id);
    if (user?.password) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
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
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password was set successfully",
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
        res.status(200).json({
          status: "success",
          statusCode: 200,
          message: "User has logged in successfully",
          data: generateJWTTokens(user as User),
        });
        return;
      }
    }

    const user = await userService.createUserByFacebook(fbUserData);
    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "User was created and logged in successfully",
      data: generateJWTTokens(user as User),
    });
  } catch (err) {
    if (err instanceof DatabaseError) {
      if (err.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "The associated email is already in use",
          details: "Please use another account",
        });
        return;
      }

      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Unidentified database error",
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
        res.status(200).json({
          status: "error",
          statusCode: 200,
          message: "User has logged in successfully",
          data: generateJWTTokens(user as User),
        });
        return;
      }
    }

    const user = await userService.createUserByGoogle(googleUserData);
    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "User was created and logged in successfully",
      data: generateJWTTokens(user as User),
    });
  } catch (err) {
    if (err instanceof DatabaseError) {
      if (err.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "The associated account is already in use",
          details: "Please use another account",
        });
        return;
      }

      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Unidentified database error",
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

export async function linkAccount(req: Request, res: Response) {
  assertAuthenticated(req);
  const input = req.body as LinkAccountDTO;
  const { provider } = input;
  let providerAccountId = null;
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User was not found",
        details: "User with provided id not found",
      });
      return;
    }
    if (provider === "facebook") {
      const fbUserData = await getFacebookUserData(input.accessToken);
      providerAccountId = fbUserData.id;
    } else {
      const data = await getGoogleUserData(input.idToken);
      if (!data) {
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

    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Account was linked successfully",
      data: account,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "The associated account is already in use",
          details: "Please use another account",
        });
        return;
      }

      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: "Unidentified database error",
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

export async function unlinkAccount(req: Request, res: Response) {
  assertAuthenticated(req);
  const { provider } = req.params as UnlinkAccountDTO;
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User was not found",
        details: "User with provided id not found",
      });
      return;
    }
    if (!user.password) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User has no password",
        details: "Please set your password to unlink your account",
      });
      return;
    }
    const account = await userService.unLinkAccount(provider, req.user.id);
    if (!account.rowCount) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Account was not found",
        details: "Please try with another account",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Account was unlinked successfully",
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

export async function getAccounts(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const accounts = await userService.getAccountsByUserId(req.user.id);
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Accounts were retrieved successfully",
      data: accounts,
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
