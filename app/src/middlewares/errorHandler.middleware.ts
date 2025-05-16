import { type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import type { Locales } from "../i18n/i18n-types";
import L from "../i18n/i18n-node";

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
