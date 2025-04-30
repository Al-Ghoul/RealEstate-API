import { Request, Response } from "express";
import * as userService from "../services/userService";
import { assertAuthenticated } from "../lib/assertions";
import { type UpdateUserDTO } from "../lib/dtos/user.dto";
import { generateBlurHash } from "../lib/blurHashGenerator";

export async function updateProfileImage(req: Request, res: Response) {
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

  const blurHash = await generateBlurHash(req.file.path);

  await userService.updateUserProfileImage(
    req.user.id,
    // TODO: change this to use an env var
    `${req.protocol}://${
      req.get("host") ?? "localhost"
    }/public/uploads/profile-images/${req.file.filename}`,
  );

  try {
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

export async function updateUser(req: Request, res: Response) {
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

export async function updateUserProfile(req: Request, res: Response) {
  assertAuthenticated(req);
  try {
    const profile = await userService.updateUserProfile(req.user.id, req.body);
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
