import { type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import type { Locales } from "../i18n/i18n-types";
import L from "../i18n/i18n-node";
import { logger } from "../utils/logger.utils";

export function errorHandlerMiddleware(
  err: Error | multer.MulterError | null,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const lang = req.locale.language as Locales;

  if (err) {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        requestId: req.id,
        message: L[lang].UNABLE_TO_UPLOAD_IMAGE(),
        details: L[lang].UNABLE_TO_UPLOAD_IMAGE_DETAILS(),
      });
    } else if (err instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: err.message,
          stack: err.stack,
          browser: req.headers["user-agent"],
        },
      });
      res.status(400).json({
        requestId: req.id,
        message: L[lang].UNABLE_TO_UPLOAD_IMAGE(),
        details: L[lang].UNABLE_TO_UPLOAD_IMAGE_DETAILS(),
      });
    }
    return;
  }

  next(err);
}
