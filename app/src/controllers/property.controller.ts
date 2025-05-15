import { type Request, type Response } from "express";
import { assertAuthenticated } from "../utils/assertions.utils";
import type { Locales } from "../i18n/i18n-types";
import * as propertyService from "../services/property.service";
import L from "../i18n/i18n-node";
import {
  queryParamsSchema,
  type CreatePropertyDTO,
} from "../dtos/property.dto";
import { logger } from "../utils/logger.utils";

export async function createProperty(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;

  if (!req.user.roles.includes("agent") && !req.user.roles.includes("admin")) {
    res.status(403).json({
      status: "error",
      statusCode: 403,
      message: L[lang].ACCESS_DENIED(),
      details: L[lang].ACCESS_DENIED_DETAILS(),
    });
    return;
  }

  try {
    const property = await propertyService.createProperty({
      ...(req.body as CreatePropertyDTO),
      userId: req.user.id,
    });
    res.status(201).json({
      status: "success",
      statusCode: 201,
      message: L[lang].PROPERTY_CREATED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
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
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    }

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: L[lang].INTERNAL_SERVER_ERROR(),
    });
  }
}

export async function getProperties(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const parsed = queryParamsSchema.safeParse(req.query);

  if (!parsed.success) {
    const errors = parsed.error.errors;
    res.status(400).json({
      status: "error",
      statusCode: 400,
      message: L[lang].INPUT_VALIDATION_ERROR(),
      errors: errors.map((error) => {
        return { path: error.path[0], message: error.message };
      }),
    });
    return;
  }

  try {
    const results = await propertyService.getProperties(parsed.data);
    const totalProperties = await propertyService.getTotalProperties();

    const { limit, cursor } = parsed.data;

    const hasNextPage = results.length > limit;
    const trimmedResults = hasNextPage ? results.slice(0, limit) : results;

    const lastElement = results.length
      ? results[results.length - (results.length > limit ? 2 : 1)]
      : null;

    const meta = {
      has_next_page: hasNextPage,
      has_previous_page: cursor > 0,
      total: totalProperties,
      count: results.length > limit ? results.length - 1 : results.length,
      current_page: cursor / limit + 1,
      per_page: limit,
      last_page: Math.ceil(totalProperties / limit),
      next_cursor: hasNextPage ? lastElement?.id : null,
      cursor_created_at: hasNextPage ? lastElement?.createdAt : null,
    };

    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: L[lang].PROPERTIES_RETRIEVED_SUCCESSFULLY(),
      meta,
      data: trimmedResults,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
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
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    }

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: L[lang].INTERNAL_SERVER_ERROR(),
    });
  }
}
