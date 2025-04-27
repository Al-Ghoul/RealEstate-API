import { Request, Response } from "express";
import * as userService from "../services/userService";
import { assertAuthenticated } from "../lib/assertions";
import { type UpdateUserDTO } from "../lib/dtos/users.dto";

export async function updateProfileImage(req: Request, res: Response) {
  assertAuthenticated(req);
  if (!req.file) {
    res.status(400).json({
      status: "error",
      statusCode: 400,
      message: "No file uploaded",
      details: "Please upload a file",
    });
    return;
  }

  await userService.updateUserImage(
    req.user.id,
    `${req.protocol}://${
      req.get("host") ?? "localhost"
    }/public/uploads/profile-images/${req.file.filename}`,
  );

  try {
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Profile image updated successfully",
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
      message: "User updated successfully",
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
