import { type Request, type Response } from "express";
import { assertAuthenticated } from "../utils/assertions.utils";
import type { Locales } from "../i18n/i18n-types";
import * as chatService from "../services/chat.service";
import L from "../i18n/i18n-node";
import { logger } from "../utils/logger.utils";
import type { ChatInputDTO } from "../dtos/chat.dto";

export async function createChat(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const { userId: targetUserId } = req.body as ChatInputDTO;

  try {
    const chat = await chatService.createChat(req.user.id, targetUserId);

    logger.info({
      router: req.originalUrl,
      message: "Chat was created successfully",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      message: L[lang].CHAT_CREATED_SUCCESSFULLY(),
      data: chat,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          stack: error.stack,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error,
          ip: req.ip,
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
