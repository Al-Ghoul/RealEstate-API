import { z } from "zod";
import {
  acceptLanguageHeader,
  createSuccessResponseSchema,
  GenericResponseSchema,
  metaSchema,
  ValidationErrorResponseSchema,
} from "../dtos";
import {
  basePropertyDTO,
  createPropertyInputDTO,
  propertyQueryParamsSchema,
} from "../dtos/property.dto";
import L from "../i18n/i18n-node";
import { registry } from "../utils/swagger.utils";
import { bearerAuth } from "./auth.docs";

const lang = "en";

registry.registerPath({
  method: "post",
  path: "/api/properties",
  tags: ["Properties"],
  description: "Create a property",
  summary: "Create a property",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    body: {
      content: {
        "multipart/form-data": {
          schema: createPropertyInputDTO.extend({
            thumbnail: z.string().openapi({
              format: "binary",
              description: "The thumbnail image file",
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: L[lang].PROPERTY_CREATED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(basePropertyDTO),
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
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()}, ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()} or ${L[lang].ACCESS_DENIED()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/properties",
  tags: ["Properties"],
  description: "Get and filter properties",
  summary: "Get and filter properties",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    query: propertyQueryParamsSchema,
  },
  responses: {
    200: {
      description: L[lang].PROPERTIES_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(basePropertyDTO), {
            meta: metaSchema,
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
      description: L[lang].ACCESS_DENIED(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    403: {
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    500: {
      description: L[lang].INTERNAL_SERVER_ERROR(),
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
  },
});
