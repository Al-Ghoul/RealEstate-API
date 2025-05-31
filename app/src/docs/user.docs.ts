import { z } from "zod";
import {
  acceptLanguageHeader,
  createSuccessResponseSchema,
  genericResponseSchema,
} from "../dtos";
import L from "../i18n/i18n-node";
import { registry } from "../utils/swagger.utils";
import { bearerAuth } from "./auth.docs";
import { baseProfileDTO } from "../dtos/profile.dto";
import { baseUserDTO, getUserByIdInputDTO } from "../dtos/user.dto";

const lang = "en";

registry.registerPath({
  method: "get",
  path: "/api/users/{id}",
  tags: ["Users"],
  description: "Get a user by id",
  summary: "Get a user by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getUserByIdInputDTO,
  },
  responses: {
    200: {
      description: L[lang].USER_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            baseUserDTO.omit({ password: true }),
          ),
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
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
    404: {
      description: L[lang].USER_NOT_FOUND(),
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
  path: "/api/users/{id}/profile",
  tags: ["Users"],
  description: "Get a user by id",
  summary: "Get a user by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getUserByIdInputDTO,
  },
  responses: {
    200: {
      description: L[lang].USER_PROFILE_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            baseProfileDTO.omit({ userId: true }),
          ),
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
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
    404: {
      description: L[lang].USER_PROFILE_NOT_FOUND(),
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
  path: "/api/users/me",
  tags: ["Users | Me"],
  description: "Get current user",
  summary: "Get current user",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
  },
  responses: {
    200: {
      description: L[lang].USER_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            baseUserDTO.omit({ password: true }).extend({
              hasPassword: z.boolean(),
            }),
          ),
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
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
  method: "patch",
  path: "/api/users/me",
  tags: ["Users | Me"],
  description: "Update current user",
  summary: "Update current user",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
  },
  responses: {
    200: {
      description: L[lang].USER_UPDATE_SUCCESS(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            baseUserDTO.omit({ password: true }),
          ),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
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
  path: "/api/users/me/profile",
  tags: ["Users | Me"],
  description: "Get current user's profile",
  summary: "Get current user's profile",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
  },
  responses: {
    200: {
      description: L[lang].USER_PROFILE_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            baseProfileDTO.omit({ userId: true }),
          ),
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
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
  method: "patch",
  path: "/api/users/me/profile",
  tags: ["Users | Me"],
  description: "Update current user's profile",
  summary: "Update current user's profile",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
  },
  responses: {
    200: {
      description: L[lang].USER_PROFILE_UPDATE_SUCCESS(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            baseProfileDTO.omit({ userId: true }),
          ),
        },
      },
    },
    400: {
      description: L[lang].INPUT_VALIDATION_ERROR(),
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
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
  method: "put",
  path: "/api/users/me/image",
  tags: ["Users | Me"],
  description: "Update current user's image",
  summary: "Update current user's image",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            image: z.string().openapi({
              format: "binary",
              description: "The profile image file",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].PROFILE_IMAGE_UPDATE_SUCCESS(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(
            z.object({
              blurHash: z.string(),
            }),
          ),
        },
      },
    },
    400: {
      description: `${L[lang].INPUT_VALIDATION_ERROR()}, ${L[
        lang
      ].INVALID_IMAGE_FORMAT()} or ${L[lang].NO_IMAGE_PROVIDED()}`,
      content: {
        "application/json": {
          schema: genericResponseSchema,
        },
      },
    },
    401: {
      description: L[lang].ACCESS_DENIED(),
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
