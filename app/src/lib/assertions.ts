import { Request } from "express";

export function assertAuthenticated(
  req: Request,
): asserts req is Request & { user: User } {
  if (!req.user) {
    throw new Error("Unauthenticated request");
  }
}
