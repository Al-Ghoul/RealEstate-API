import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";
import { redisClient } from "../utils/redis.utils";
import { logger } from "../utils/logger.utils";
import type { Locales } from "../i18n/i18n-types";
import L from "../i18n/i18n-node";

export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(" ")[1];
  const lang = req.locale.language as Locales;

  if (!token) {
    logger.warn({
      route: req.originalUrl,
      message: "Missing authorization token",
      info: {
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(401).json({
      status: "error",
      statusCode: 401,
      message: L[lang].ACCESS_DENIED(),
      details: L[lang].MISSING_AUTHORIZATION_TOKEN_DETAILS(),
    });

    return;
  }

  try {
    const { header, payload } = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.TOKEN_ISSUER,
      audience: env.TOKEN_AUDIENCE,
      complete: true,
    });
    const { kid } = header;
    const { sub, token_type } = payload as jwt.JwtPayload;

    if (token_type !== "access" || !sub || !kid) {
      logger.warn({
        route: req.originalUrl,
        message: "Invalid Token",
        info: {
          requestId: req.id,
          userId: sub,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(403).json({
        status: "error",
        statusCode: 403,
        message: L[lang].INVALID_ACCESS_TOKEN(),
        details: L[lang].INVALID_ACCESS_TOKEN_DETAILS(),
      });

      return;
    }

    try {
      const isBlacklisted = await redisClient.get(`blacklist:${kid}`);
      if (isBlacklisted) {
        logger.warn({
          route: req.originalUrl,
          message: "Token has been revoked",
          info: {
            requestId: req.id,
            userId: sub,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(403).json({
          status: "error",
          statusCode: 403,
          message: L[lang].REVOKED_ACCESS_TOKEN(),
          details: L[lang].REVOKED_ACCESS_TOKEN_DETAILS(),
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error({
          router: req.originalUrl,
          message: "Redis client error",
          info: {
            requestId: req.id,
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });
      } else {
        logger.error({
          router: req.originalUrl,
          message: "Redis client error",
          info: {
            requestId: req.id,
            error,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });
      }

      res.status(500).json({
        status: "error",
        statusCode: 500,
        message: L[lang].INTERNAL_SERVER_ERROR(),
        details: L[lang].INTERNAL_SERVER_ERROR_DETAILS(),
      });
      return;
    }

    req.user = { id: sub };
    next();
  } catch (error) {
    logger.warn({
      route: req.originalUrl,
      message: "Invalid Token",
      info: {
        requestId: req.id,
        ip: req.ip,
        error: error,
        browser: req.headers["user-agent"],
      },
    });

    res.status(401).json({
      status: "error",
      statusCode: 401,
      message: L[lang].INVALID_ACCESS_TOKEN(),
      details: L[lang].INVALID_ACCESS_TOKEN_DETAILS(),
    });
  }
}
