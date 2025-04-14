import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const schemaValidatorMiddleware = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
          message: "Validation failed",
          errors: errors.map((error) => {
            return { path: error.path[0], message: error.message };
          }),
        });
      } else {
        res.status(500).json({
          message: "Internal server error",
          status: "error",
          statusCode: 500,
        });
      }
    }
  };
};
