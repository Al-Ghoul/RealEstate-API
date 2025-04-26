import { Request, Response } from "express";
import { type CreateUserDTO } from "../lib/dtos/users.dto";
import {
  type RequestResetCodeDTO,
  type LoginUserDTO,
  type RefreshTokenInputDTO,
  type VerifyUserDTO,
  type PasswordResetDTO,
  type ChangePasswordDTO,
  type LoginWithFacebookDTO,
  type LinkAccountDTO,
  type UnlinkAccountDTO,
  type SetPasswordDTO,
  type LoginWithGoogleDTO,
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
import {
  generateJWTTokens,
  getFacebookUserData,
  getGoogleUserData,
} from "../lib/auth";
import { assertAuthenticated } from "../lib/assertions";

export async function registerUser(req: Request, res: Response) {
  const input = req.body as CreateUserDTO;
  const hashedPassword = await bcrypt.hash(input.password, 10);
  try {
    const user = (
      await userService.createUser({
        ...input,
        email: input.email.toLowerCase(),
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
    }
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Database error",
      details: "Something went wrong, please try again later",
    });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { password, email } = req.body as LoginUserDTO;
    const user = await userService.getUser(email.toLowerCase());

    if (user) {
      if (!user.password) {
        const accounts = await userService.getAccountsByUserId(user.id);
        if (accounts.length > 0) {
          res.status(403).json({
            status: "error",
            statusCode: 403,
            message:
              "This email is associated with a social login. Please sign in with your social provider (e.g., Google, Facebook).",
            details:
              "Please sign in with your social provider (e.g., Google, Facebook).",
          });
        }
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
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
        message: "Login successful",
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

    await redis.setEx(
      `blacklist:${refreshToken}`,
      exp - Math.floor(Date.now() / 1000),
      "1",
    );

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Refreshed token successfully",
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
        statusCode: 404,
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
    const verificationCode =
      await verificationCodeService.getVerCodeByCodeAndType(
        code,
        "EMAIL_VERIFICATION",
      );
    if (!verificationCode) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Verification code not found or expired",
        details: "Please provide a valid verification code",
      });
      return;
    }

    await userService.verifyUser(verificationCode.userId);
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
        statusCode: 404,
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

export async function resetUserPassword(req: Request, res: Response) {
  const input = req.body as PasswordResetDTO;

  try {
    const resetCode = await verificationCodeService.getVerCodeByCodeAndType(
      input.code,
      "PASSWORD_RESET",
    );
    if (!resetCode || !resetCode.userId) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Reset code expired or not found",
        details: "Please provide a valid reset code",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
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

export async function getCurrentUser(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "User not found",
        details: "User with provided id not found",
      });
      return;
    }
    const finalUser = { ...user, hasPassword: !!user.password } as User;
    delete finalUser.password;
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User found successfully",
      data: finalUser,
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
        message: "User not found",
        details: "User with provided id not found",
      });
      return;
    }

    if (!user.password) {
      res.status(403).json({
        status: "error",
        statusCode: 400,
        message: "User has no password",
        details: "Please set your password to change your password",
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(
      input.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Current password is incorrect",
        details: "Please try again later",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
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

export async function loginWithFacebook(req: Request, res: Response) {
  const { accessToken } = req.body as LoginWithFacebookDTO;
  try {
    const fbUserData = await getFacebookUserData(accessToken);
    let user = await userService.getUserByProviderAndId(
      "facebook",
      fbUserData.id,
    );

    if (user) {
      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Login successful",
        data: generateJWTTokens(user as User),
      });
      return;
    }

    user = await userService.createUserByFacebook(fbUserData);
    res.status(200).json({
      status: "success",
      statusCode: 201,
      message: "Login successful",
      data: generateJWTTokens(user as User),
    });
  } catch (err) {
    if (err instanceof DatabaseError) {
      if (err.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "Email or account with provider already in use",
          details: "Please either use another account or provider",
        });
        return;
      }
    }
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
      message: "Accounts retrieved successfully",
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
        message: "User not found",
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
      statusCode: 200,
      message: "Account linked successfully",
      data: account,
    });
  } catch (err) {
    if (err instanceof DatabaseError) {
      if (err.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "Email or account with provider already in use",
          details: "Please either use another account or provider",
        });
        return;
      }
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
        message: "User not found",
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
        message: "Account with provider not found",
        details: "Please check your provider and try again",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Account unlinked successfully",
    });
    return;
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
    const password = await bcrypt.hash(input.newPassword, 10);
    await userService.updateUserPassword(req.user.id, password);
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Password set successfully",
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

export async function loginWithGoogle(req: Request, res: Response) {
  const { idToken } = req.body as LoginWithGoogleDTO;
  let user = null;
  try {
    const googleUserData = await getGoogleUserData(idToken);
    user = await userService.getUserByProviderAndId(
      "google",
      googleUserData?.sub ?? "",
    );
    user = await userService.createUserByGoogle(googleUserData);

    if (!user) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "User could not be retrieved nor created",
        details: "Please try again later",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Login successful",
      data: generateJWTTokens(user as User),
    });
    return;
  } catch (err) {
    if (err instanceof DatabaseError) {
      if (err.code === "23505") {
        res.status(409).json({
          status: "error",
          statusCode: 409,
          message: "Email or account with provider already in use",
          details: "Please either use another account or provider",
        });
        return;
      }
    }
    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Internal server error",
      details: "Something went wrong, please try again later",
    });
  }
}
