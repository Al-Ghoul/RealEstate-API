import { z } from "zod";
import {
  acceptLanguageHeader,
  createSuccessResponseSchema,
  genericResponseSchema,
  ValidationErrorResponseSchema,
} from "../dtos";
import {
  chatMetaSchema,
  chatOutputDTO,
  chatQueryParamsSchema,
  getChatByIdInputDTO,
  messageOutputDTO,
} from "../dtos/chat.dto";
import L from "../i18n/i18n-node";
import { registry } from "../utils/swagger.utils";
import { bearerAuth } from "./auth.docs";

const lang = "en";

registry.registerPath({
  method: "get",
  path: "/api/chats",
  tags: ["Chat"],
  description: "Get and filter user's chats",
  summary: "Get and filter user's chats",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    query: chatQueryParamsSchema,
  },
  responses: {
    200: {
      description: L[lang].USER_CHATS_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(chatOutputDTO), {
            meta: chatMetaSchema,
          }),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].MISSING_AUTHORIZATION_TOKEN(),
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },

    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/chats/{id}/messages",
  tags: ["Chat"],
  description: "Get and filter chat's messages",
  summary: "Get and filter chat's messages",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    query: chatQueryParamsSchema,
    params: getChatByIdInputDTO,
  },
  responses: {
    200: {
      description: L[lang].USER_CHAT_MESSAGES_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(messageOutputDTO), {
            meta: chatMetaSchema,
          }),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].MISSING_AUTHORIZATION_TOKEN(),
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()}, ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()} or ${L[lang].USER_IS_NOT_A_PARTICIPANT()}`,
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
  },
});
