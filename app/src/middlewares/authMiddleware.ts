import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { redis } from "../clients/redis";
import { logger } from "../lib/logger";

export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(" ")[1];

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
      message: "Access Denied",
      details: "Missing authorization token",
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
        message: "Invalid Token",
        details: "Please re-login",
      });

      return;
    }

    const isBlacklisted = await redis.get(`blacklist:${kid}`);
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
        message: "Token has been revoked",
        details: "Please re-login",
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
      message: "Invalid Token",
      details: "Please re-login",
    });
  }
}
