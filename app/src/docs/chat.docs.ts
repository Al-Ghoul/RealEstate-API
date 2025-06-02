import {
  acceptLanguageHeader,
  createSuccessResponseSchema,
  genericResponseSchema,
  ValidationErrorResponseSchema,
} from "../dtos";
import { chatInputDTO, chatOutputDTO } from "../dtos/chat.dto";
import L from "../i18n/i18n-node";
import { registry } from "../utils/swagger.utils";

const lang = "en";

registry.registerPath({
  method: "post",
  path: "/api/chat",
  tags: ["Chat"],
  description: "Create a new chat between two users",
  summary: "Create a new chat between two users",
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "application/json": {
          schema: chatInputDTO,
        },
      },
    },
  },
  responses: {
    201: {
      description: L[lang].CHAT_CREATED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(chatOutputDTO),
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
