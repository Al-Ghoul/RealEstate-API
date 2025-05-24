import { type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import type { Locales } from "../i18n/i18n-types";
import L from "../i18n/i18n-node";
import { logger } from "../utils/logger.utils";

export function errorHandlerMiddleware(
  error: Error | multer.MulterError | null,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const lang = req.locale.language as Locales;

  if (error) {
    if (error instanceof multer.MulterError) {
      res.status(400).json({
        requestId: req.id,
        message: L[lang].UNABLE_TO_UPLOAD_IMAGE(),
        details: L[lang].UNABLE_TO_UPLOAD_IMAGE_DETAILS(),
      });
    } else if (error instanceof Error) {
      if (error.message === "Unauthenticated") {
        logger.warn({
          route: req.originalUrl,
          message: "Missing authorization token",
          info: {
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(401).json({
          requestId: req.id,
          message: L[lang].ACCESS_DENIED(),
          details: L[lang].MISSING_AUTHORIZATION_TOKEN_DETAILS(),
        });
        return;
      }

      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
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

  next(error);
}
