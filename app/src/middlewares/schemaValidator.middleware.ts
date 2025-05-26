import { type Request, type Response, type NextFunction } from "express";
import { z, ZodError } from "zod";
import type { Locales } from "../i18n/i18n-types";
import L from "../i18n/i18n-node";
import { logger } from "../utils/logger.utils";

export function schemaValidatorMiddleware(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const lang = req.locale.language as Locales;
    try {
      schema.parse({
        ...req.body,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors;
        res.status(400).json({
          requestId: req.id,
          message: L[lang].INPUT_VALIDATION_ERROR(),
          errors: errors.map((error) => {
            return { path: error.path.join("."), message: error.message };
          }),
        });
      } else {
        if (error instanceof Error) {
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
        } else {
          logger.error({
            route: req.originalUrl,
            message: "Internal server error",
            info: {
              requestId: req.id,
              error,
              browser: req.headers["user-agent"],
            },
          });
        }

        res.status(500).json({
          requestId: req.id,
          message: L[lang].INTERNAL_SERVER_ERROR(),
          details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
        });
      }
    }
  };
}
