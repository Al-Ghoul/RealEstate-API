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
  basePropertyMediaDTO,
  createPropertyInputDTO,
  getItemByIdInputDTO,
  getMediaByIdInputDTO,
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
      description: `${L[lang].INPUT_VALIDATION_ERROR()} or ${L[
        lang
      ].INVALID_IMAGE_FORMAT()}`,
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

registry.registerPath({
  method: "get",
  path: "/api/properties/{id}",
  tags: ["Properties"],
  description: "Get a property by id",
  summary: "Get a property by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getItemByIdInputDTO,
  },
  responses: {
    200: {
      description: L[lang].PROPERTY_RETRIEVED_SUCCESSFULLY(),
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
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    404: {
      description: L[lang].PROPERTY_NOT_FOUND(),
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
  method: "delete",
  path: "/api/properties/{id}",
  tags: ["Properties"],
  description: "Delete a property by id",
  summary: "Delete a property by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getItemByIdInputDTO,
  },
  responses: {
    200: {
      description: L[lang].PROPERTY_DELETED_SUCCESSFULLY(),
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
      description: `${L[lang].INVALID_ACCESS_TOKEN()} or ${L[
        lang
      ].REVOKED_ACCESS_TOKEN()}`,
      content: {
        "application/json": {
          schema: GenericResponseSchema,
        },
      },
    },
    404: {
      description: L[lang].PROPERTY_NOT_FOUND(),
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
  method: "patch",
  path: "/api/properties/{id}",
  tags: ["Properties"],
  description: "Update a property by id",
  summary: "Update a property by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getItemByIdInputDTO,
    body: {
      content: {
        "multipart/form-data": {
          schema: createPropertyInputDTO.extend({
            thumbnail: z
              .string()
              .openapi({
                format: "binary",
                description: "The thumbnail image file",
              })
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: L[lang].PROPERTY_UPDATED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(basePropertyDTO),
        },
      },
    },
    400: {
      description: `${L[lang].INPUT_VALIDATION_ERROR()} or ${L[
        lang
      ].INVALID_IMAGE_FORMAT()}`,
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
    404: {
      description: L[lang].PROPERTY_NOT_FOUND(),
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
  method: "post",
  path: "/api/properties/{id}/media",
  tags: ["Properties"],
  description: "Add a media to a property by id",
  summary: "Add a media to a property by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getItemByIdInputDTO,
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            media: z.array(
              z.string().openapi({
                format: "binary",
                description: "The media files",
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: L[lang].PROPERTY_MEDIA_CREATED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(basePropertyMediaDTO)),
        },
      },
    },
    400: {
      description: `${L[lang].INPUT_VALIDATION_ERROR()}, ${L[
        lang
      ].INVALID_MEDIA_FILES()} or ${L[lang].PROPERTY_MEDIA_LIMIT_REACHED()}`,
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
    404: {
      description: L[lang].PROPERTY_NOT_FOUND(),
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
  path: "/api/properties/{id}/media",
  tags: ["Properties"],
  description: "Get all media of a property by id",
  summary: "Get all media of a property by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getItemByIdInputDTO,
  },
  responses: {
    200: {
      description: L[lang].PROPERTY_MEDIA_RETRIEVED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(basePropertyMediaDTO)),
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

registry.registerPath({
  method: "delete",
  path: "/api/properties/{id}/media/{mediaId}",
  tags: ["Properties"],
  description: "Delete a media of a property by id",
  summary: "Delete a media of a property by id",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    headers: [acceptLanguageHeader],
    params: getItemByIdInputDTO.merge(getMediaByIdInputDTO),
  },
  responses: {
    200: {
      description: L[lang].PROPERTY_MEDIA_DELETED_SUCCESSFULLY(),
      content: {
        "application/json": {
          schema: createSuccessResponseSchema(z.array(basePropertyMediaDTO)),
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
    404: {
      description: `${L[lang].PROPERTY_NOT_FOUND()} or ${L[
        lang
      ].PROPERTY_HAS_NO_MEDIA()}`,
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
