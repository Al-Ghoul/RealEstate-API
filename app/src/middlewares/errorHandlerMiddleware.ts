import { type Request, type Response, type NextFunction } from "express";
import multer from "multer";

export function errorHandlerMiddleware(
  err: Error | multer.MulterError | null,
  _: Request,
  res: Response,
  next: NextFunction,
) {
  if (err) {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: `Multer error: ${err.message}`,
        details: "Unable to upload image",
      });
      return;
    } else if (err instanceof Error) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: `Error: ${err.message}`,
        details: "Please upload an image",
      });
      return;
    }
  }

  next(err);
}
