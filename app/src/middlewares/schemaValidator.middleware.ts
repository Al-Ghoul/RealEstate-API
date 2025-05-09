import { type Request, type Response, type NextFunction } from "express";
import { z, ZodError } from "zod";
import type { Locales } from "../i18n/i18n-types";
import L from "../i18n/i18n-node";
import { logger } from "../config/logger.config";
import { configureZodI18n } from "../utils/dtos";

export function schemaValidatorMiddleware(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const lang = req.locale.language as Locales;
    configureZodI18n(lang);
    try {
      schema.parse({
        ...req.body,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors;
        res.status(400).json({
          status: "error",
          statusCode: 400,
          message: L[lang].INPUT_VALIDATION_ERROR(),
          errors: errors.map((error) => {
            return { path: error.path[0], message: error.message };
          }),
        });
      } else {
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
          requestId: req.id,
          status: "error",
          statusCode: 500,
          message: L[lang].INTERNAL_SERVER_ERROR(),
          details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
        });
      }
    }
  };
}
