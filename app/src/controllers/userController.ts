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
import path from "path";

export async function getCurrentUser(req: Request, res: Response) {
  assertAuthenticated(req);
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
    const finalUser = { ...user, hasPassword: !!user.password } as User & {
      hasPassword: boolean;
    };
    // @ts-expect-error TS complains about this, but we MUST delete it...
    delete finalUser.password;
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User was retrieved successfully",
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

export async function updateCurrentUser(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const user = await userService.updateUser(
      req.user.id,
      req.body as UpdateUserDTO,
    );
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User was updated successfully",
      data: user,
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

export async function getCurrentUserProfile(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const profile = await userService.getUserProfile(req.user.id);
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User profile was retrieved successfully",
      data: profile,
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

export async function updateCurrentUserProfile(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const profile = await userService.updateUserProfile(
      req.user.id,
      req.body as UpdateUserProfileDTO,
    );
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "User profile was updated successfully",
      data: profile,
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

export async function updateCurrentUserProfileImage(
  req: Request,
  res: Response,
) {
  assertAuthenticated(req);

  if (!req.file) {
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
    res.status(400).json({
      status: "error",
      statusCode: 400,
      message: "Invalid mime type",
      details: "Please upload an image",
    });
    return;
  }

  const uploadDir =
    process.env.UPLOAD_PATH ||
    path.join(__dirname, "../../public/uploads/profile-images/");
  const filePath = `${uploadDir}${Date.now().toString()}-${originalname}`;
  await fs.writeFile(filePath, buffer);

  try {
    const blurHash = await generateBlurHash(buffer);
    await userService.updateUserProfileImage(
      req.user.id,
      // TODO: change this to use an env var
      {
        image: `${req.protocol}://${
          req.get("host") ?? "localhost"
        }/public/uploads/profile-images/${req.file.filename}`,
        imageBlurHash: blurHash,
      },
    );

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Profile image was updated successfully",
      data: { blurHash },
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
