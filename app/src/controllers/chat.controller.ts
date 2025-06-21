import { type Request, type Response } from "express";
import { assertAuthenticated } from "../utils/assertions.utils";
import type { Locales } from "../i18n/i18n-types";
import * as chatService from "../services/chat.service";
import L from "../i18n/i18n-node";
import { logger } from "../utils/logger.utils";
import { chatQueryParams, getChatByIdInputDTO } from "../dtos/chat.dto";
import { ensureParticipant } from "../services/chat.service";

export async function getUserChats(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const input = chatQueryParams.safeParse(req.query);

  if (!input.success) {
    logger.warn({
      router: req.originalUrl,
      message: "Invalid input",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });
    const errors = input.error.errors;
    res.status(400).json({
      requestId: req.id,
      message: L[lang].INPUT_VALIDATION_ERROR(),
      errors: errors.map((error) => {
        return { path: error.path[0], message: error.message };
      }),
    });
    return;
  }

  try {
    const results = await chatService.getUserChats({
      userId: req.user.id,
      ...input.data,
    });
    const { limit, cursor } = input.data;

    const hasNextPage = results.length > limit;
    const trimmedResults = hasNextPage ? results.slice(0, limit) : results;

    const lastElement = results.length
      ? results[results.length - (results.length > limit ? 2 : 1)]
      : null;

    const meta = {
      has_next_page: hasNextPage,
      has_previous_page: cursor !== undefined,
      count: results.length > limit ? results.length - 1 : results.length,
      per_page: limit,
      next_cursor: hasNextPage ? lastElement?.lastMessageId : null,
      next_cursor_created_at: hasNextPage
        ? lastElement?.lastMessageCreatedAt
        : null,
    };

    logger.info({
      router: req.originalUrl,
      message: "User chats were retrieved successfully",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      message: L[lang].USER_CHATS_RETRIEVED_SUCCESSFULLY(),
      data: trimmedResults,
      meta,
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

export async function getUserChatMessages(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const pathParams = getChatByIdInputDTO.safeParse(req.params);
  const queryParams = chatQueryParams.safeParse(req.query);

  if (!pathParams.success || !queryParams.success) {
    logger.warn({
      router: req.originalUrl,
      message: "Invalid input",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });
    const errors = pathParams.error?.errors || queryParams.error?.errors;
    res.status(400).json({
      requestId: req.id,
      message: L[lang].INPUT_VALIDATION_ERROR(),
      errors: errors?.map((error) => {
        return { path: error.path[0], message: error.message };
      }),
    });

    return;
  }

  if (!(await ensureParticipant(pathParams.data.id, req.user.id))) {
    logger.warn({
      router: req.originalUrl,
      message: "User is not a participant",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(403).json({
      requestId: req.id,
      message: L[lang].USER_IS_NOT_A_PARTICIPANT(),
    });

    return;
  }

  try {
    const results = await chatService.getUserChatMessages({
      chatId: pathParams.data.id,
      ...queryParams.data,
      userId: req.user.id,
    });
    const { limit, cursor } = queryParams.data;

    const hasNextPage = results.length > limit;
    const trimmedResults = hasNextPage ? results.slice(0, limit) : results;

    const lastElement = results.length
      ? results[results.length - (results.length > limit ? 2 : 1)]
      : null;

    const meta = {
      has_next_page: hasNextPage,
      has_previous_page: cursor !== undefined,
      count: results.length > limit ? results.length - 1 : results.length,
      per_page: limit,
      next_cursor: hasNextPage ? lastElement?.id : null,
      next_cursor_created_at: hasNextPage ? lastElement?.createdAt : null,
    };

    logger.info({
      router: req.originalUrl,
      message: "User chat messages were retrieved successfully",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(200).json({
      message: L[lang].USER_CHAT_MESSAGES_RETRIEVED_SUCCESSFULLY(),
      data: trimmedResults,
      meta,
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
