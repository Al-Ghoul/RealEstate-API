import { z } from "zod";
import {
  acceptLanguageHeader,
  createSuccessResponseSchema,
  GenericResponseSchema,
  metaSchema,
  ValidationErrorResponseSchema,
} from "../dtos";
import {
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
        "application/json": {
          schema: createPropertyInputDTO
            .omit({ id: true, userId: true })
            .strict(),
        },
      },
    },
  },
  responses: {
    201: {
      description: L[lang].PROPERTY_CREATED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(createPropertyInputDTO),
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
    params: propertyQueryParamsSchema,
  },
  responses: {
    200: {
      description: L[lang].PROPERTIES_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(createPropertyInputDTO), {
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
