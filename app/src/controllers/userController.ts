import { type Request, type Response } from "express";
import * as userService from "../services/userService";
import { assertAuthenticated } from "../lib/assertions";
import {
  type UpdateUserDTO,
  type UpdateUserProfileDTO,
} from "../lib/dtos/user.dto";
import { generateBlurHash } from "../lib/blurHashGenerator";
import { fileTypeFromBuffer } from "file-type";
import fs from "fs/promises";
import { join } from "path";
import { logger } from "../lib/logger";

export async function getCurrentUser(req: Request, res: Response) {
  assertAuthenticated(req);

  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      logger.warn({
        router: req.originalUrl,
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

    const finalUser = { ...user, hasPassword: !!user.password } as User & {
      hasPassword: boolean;
    };
    // @ts-expect-error TS complains about this, but we can and MUST delete it...
    delete finalUser.password;

    logger.info({
      router: req.originalUrl,
      message: "User was retrieved successfully",
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
      message: "User was retrieved successfully",
      data: finalUser,
    });
  } catch (error) {
    logger.error({
      router: req.originalUrl,
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

export async function updateCurrentUser(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const user = await userService.updateUser(
      req.user.id,
      req.body as UpdateUserDTO,
    );

    logger.info({
      router: req.originalUrl,
      message: "User was updated successfully",
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
      message: "User was updated successfully",
      data: user,
    });
  } catch (error) {
    logger.error({
      router: req.originalUrl,
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

export async function getCurrentUserProfile(req: Request, res: Response) {
  assertAuthenticated(req);

  try {
    const profile = await userService.getUserProfile(req.user.id);

    logger.info({
      router: req.originalUrl,
      message: "User profile was retrieved successfully",
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
      message: "User profile was retrieved successfully",
      data: profile,
    });
  } catch (error) {
    logger.error({
      router: req.originalUrl,
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

export async function updateCurrentUserProfile(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const profile = await userService.updateUserProfile(
      req.user.id,
      req.body as UpdateUserProfileDTO,
    );

    logger.info({
      router: req.originalUrl,
      message: "User profile was updated successfully",
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
      message: "User profile was updated successfully",
      data: profile,
    });
  } catch (error) {
    logger.error({
      router: req.originalUrl,
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

export async function updateCurrentUserProfileImage(
  req: Request,
  res: Response,
) {
  assertAuthenticated(req);

  if (!req.file) {
    logger.warn({
      router: req.originalUrl,
      message: "No image provided",
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
      message: "No image provided",
      details: "Please upload a file",
    });
    return;
  }

  const { buffer, originalname } = req.file;
  const fileType = await fileTypeFromBuffer(buffer);
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!fileType || !allowed.includes(fileType.mime)) {
    logger.warn({
      router: req.originalUrl,
      message: "Invalid mime type",
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
      message: "Invalid mime type",
      details: "Please upload an image",
    });
    return;
  }

  const uploadDir = join(process.cwd(), "public/uploads/profile-images/");
  const fileName = `${Date.now().toString()}-${originalname}`;
  const filePath = `${uploadDir}${fileName}`;
  await fs.writeFile(filePath, buffer);

  try {
    const blurHash = await generateBlurHash(buffer);
    await userService.updateUserProfileImage(
      req.user.id,
      // TODO: change this to use an env var
      {
        image: `${req.protocol}://${
          req.get("host") ?? "localhost"
        }/public/uploads/profile-images/${fileName}`,
        imageBlurHash: blurHash,
      },
    );

    logger.info({
      router: req.originalUrl,
      message: "Profile image was updated successfully",
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
      message: "Profile image was updated successfully",
      data: { blurHash },
    });
  } catch (error) {
    logger.error({
      router: req.originalUrl,
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
