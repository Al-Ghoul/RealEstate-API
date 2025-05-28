import { type Request, type Response } from "express";
import { assertAuthenticated } from "../utils/assertions.utils";
import type { Locales } from "../i18n/i18n-types";
import * as propertyService from "../services/property.service";
import L from "../i18n/i18n-node";
import {
  createPropertyInputDTO,
  getItemByIdInputDTO,
  getMediaByIdInputDTO,
  propertyQueryParams,
  type CreatePropertyMediaInputDTO,
} from "../dtos/property.dto";
import { logger } from "../utils/logger.utils";
import { fileTypeFromBuffer } from "file-type";
import fs from "fs/promises";
import { join } from "path";
import { DatabaseError } from "pg";
import { env } from "../config/env.config";

export async function createProperty(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;

  if (!req.user.roles.includes("AGENT") && !req.user.roles.includes("ADMIN")) {
    res.status(403).json({
      requestId: req.id,
      message: L[lang].ACCESS_DENIED(),
      details: L[lang].ACCESS_DENIED_DETAILS(),
    });
    return;
  }

  const input = createPropertyInputDTO.safeParse(req.body);

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

  if (!req.file) {
    logger.warn({
      router: req.originalUrl,
      message: "No image provided",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(400).json({
      requestId: req.id,
      message: L[lang].NO_IMAGE_PROVIDED(),
      details: L[lang].PLEASE_PROVIDE_AN_IMAGE(),
    });
    return;
  }

  const { buffer, originalname } = req.file;
  const fileType = await fileTypeFromBuffer(buffer);
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!fileType || !allowed.includes(fileType.mime)) {
    logger.warn({
      router: req.originalUrl,
      message: "Invalid mime type",
      info: {
        userId: req.user.id,
        requestId: req.id,
        ip: req.ip,
        browser: req.headers["user-agent"],
      },
    });

    res.status(400).json({
      requestId: req.id,
      message: L[lang].INVALID_IMAGE_FORMAT(),
      details: L[lang].PLEASE_PROVIDE_AN_IMAGE(),
    });
    return;
  }

  const uploadDir = join(
    process.cwd(),
    "public/uploads/properties-thumbnails/",
  );
  const fileName = `${Date.now().toString()}-${originalname}`;
  const filePath = `${uploadDir}${fileName}`;
  await fs.writeFile(filePath, buffer);

  try {
    const property = await propertyService.createProperty({
      ...input.data,
      thumbnailURL: `${env.DOMAIN}/public/uploads/properties-thumbnails/${fileName}`,
      userId: req.user.id,
    });

    res.status(201).json({
      message: L[lang].PROPERTY_CREATED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        logger.warn({
          route: req.originalUrl,
          message: "A property with this title already exists",
          info: {
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(409).json({
          requestId: req.id,
          message: L[lang].PROPERTY_ALREADY_EXISTS(),
          details: L[lang].PROPERTY_ALREADY_EXISTS_DETAILS(),
        });

        return;
      }
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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

export async function getProperties(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const input = propertyQueryParams.safeParse(req.query);

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
    const results = await propertyService.getProperties(input.data);
    const totalProperties = await propertyService.getTotalProperties();
    const { limit, cursor } = input.data;

    const hasNextPage = results.length > limit;
    const trimmedResults = hasNextPage ? results.slice(0, limit) : results;

    const lastElement = results.length
      ? results[results.length - (results.length > limit ? 2 : 1)]
      : null;

    const meta = {
      has_next_page: hasNextPage,
      has_previous_page: cursor > 0,
      total: totalProperties,
      count: results.length > limit ? results.length - 1 : results.length,
      current_page: cursor / limit + 1,
      per_page: limit,
      last_page: Math.ceil(totalProperties / limit),
      next_cursor: hasNextPage ? lastElement?.id : null,
      cursor_created_at: hasNextPage ? lastElement?.createdAt : null,
    };

    res.status(200).json({
      message: L[lang].PROPERTIES_RETRIEVED_SUCCESSFULLY(),
      meta,
      data: trimmedResults,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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

export async function getProperty(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const input = getItemByIdInputDTO.safeParse(req.params);

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
    const property = await propertyService.getPropertyById(input.data.id);

    if (!property) {
      logger.warn({
        route: req.originalUrl,
        message: "Property was not found",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(404).json({
        requestId: req.id,
        message: L[lang].PROPERTY_NOT_FOUND(),
        details: L[lang].PROPERTY_NOT_FOUND_DETAILS(),
      });

      return;
    }

    await propertyService.addNewView(property.id, req.user.id);

    res.status(200).json({
      message: L[lang].PROPERTY_RETRIEVED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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

export async function updateProperty(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const params = getItemByIdInputDTO.safeParse(req.params);
  const body = createPropertyInputDTO.safeParse(req.body);

  if (!params.success || !body.success) {
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
    const errors = params.error?.errors || body.error?.errors;
    res.status(400).json({
      requestId: req.id,
      message: L[lang].INPUT_VALIDATION_ERROR(),
      errors: errors?.map((error) => {
        return { path: error.path[0], message: error.message };
      }),
    });
    return;
  }

  let thumbnailURL = undefined;
  if (req.file) {
    const { buffer, originalname } = req.file;
    const fileType = await fileTypeFromBuffer(buffer);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!fileType || !allowed.includes(fileType.mime)) {
      logger.warn({
        router: req.originalUrl,
        message: "Invalid mime type",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(400).json({
        requestId: req.id,
        message: L[lang].INVALID_IMAGE_FORMAT(),
        details: L[lang].PLEASE_PROVIDE_AN_IMAGE(),
      });
      return;
    }

    const uploadDir = join(
      process.cwd(),
      "public/uploads/properties-thumbnails/",
    );
    const fileName = `${Date.now().toString()}-${originalname}`;
    const filePath = `${uploadDir}${fileName}`;
    await fs.writeFile(filePath, buffer);
    thumbnailURL = `${env.DOMAIN}/public/uploads/properties-thumbnails/${fileName}`;
  }

  try {
    const property = await propertyService.updatePropertyById({
      id: params.data.id,
      userId: req.user.id,
      thumbnailURL,
      ...body.data,
    });

    if (!property) {
      logger.warn({
        route: req.originalUrl,
        message: "Property was not found",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(404).json({
        requestId: req.id,
        message: L[lang].PROPERTY_NOT_FOUND(),
        details: L[lang].PROPERTY_NOT_FOUND_DETAILS(),
      });

      return;
    }

    res.status(200).json({
      message: L[lang].PROPERTY_UPDATED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        logger.warn({
          route: req.originalUrl,
          message: "A property with this title already exists",
          info: {
            requestId: req.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(409).json({
          requestId: req.id,
          message: L[lang].PROPERTY_ALREADY_EXISTS(),
          details: L[lang].PROPERTY_ALREADY_EXISTS_DETAILS(),
        });

        return;
      }
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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

export async function addPropertyMedia(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const params = getItemByIdInputDTO.safeParse(req.params);

  if (!params.success) {
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
    const errors = params.error.errors;
    res.status(400).json({
      requestId: req.id,
      message: L[lang].INPUT_VALIDATION_ERROR(),
      errors: errors.map((error) => {
        return { path: error.path[0], message: error.message };
      }),
    });
    return;
  }

  const files = req.files as Express.Multer.File[];
  if (files.length === 0) {
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

    res.status(400).json({
      requestId: req.id,
      message: L[lang].INPUT_VALIDATION_ERROR(),
      errors: [
        {
          path: "files",
          message: L[lang].INVALID_MEDIA_FILES_DETAILS(),
        },
      ],
    });
    return;
  }

  const propertyMedia: Array<CreatePropertyMediaInputDTO> = [];

  for (const file of files) {
    const { buffer, originalname } = file;
    const fileType = await fileTypeFromBuffer(buffer);
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (!fileType || !allowed.includes(fileType.mime)) {
      logger.warn({
        router: req.originalUrl,
        message: "Invalid mime type",
        info: {
          userId: req.user.id,
          requestId: req.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(400).json({
        requestId: req.id,
        message: L[lang].INVALID_MEDIA_FILES(),
        details: L[lang].INVALID_MEDIA_FILES_DETAILS(),
      });
      return;
    }

    const uploadDir = join(process.cwd(), "public/uploads/property-media/");
    const fileName = `${Date.now().toString()}-${originalname}`;
    const filePath = `${uploadDir}${fileName}`;
    await fs.writeFile(filePath, buffer);

    if (propertyMedia.length > 10) break; // only allow 10 media files

    propertyMedia.push({
      propertyId: params.data.id,
      url: `${env.DOMAIN}/public/uploads/property-media/${fileName}`,
      type: fileType.mime.includes("image") ? "IMAGE" : "VIDEO",
      mimeType: fileType.mime,
    });
  }

  try {
    const mediaCount = await propertyService.getMediaCount(params.data.id);
    if (propertyMedia.length + mediaCount > 10) {
      logger.warn({
        route: req.originalUrl,
        message: "Property media limit reached",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(400).json({
        requestId: req.id,
        message: L[lang].PROPERTY_MEDIA_LIMIT_REACHED(),
        details: L[lang].PROPERTY_MEDIA_LIMIT_REACHED_DETAILS(),
      });

      return;
    }

    const property = await propertyService.addPropertyMedia(propertyMedia);

    if (!property.length) {
      logger.warn({
        route: req.originalUrl,
        message: "Property was not found",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(404).json({
        requestId: req.id,
        message: L[lang].PROPERTY_NOT_FOUND(),
        details: L[lang].PROPERTY_NOT_FOUND_DETAILS(),
      });

      return;
    }

    res.status(201).json({
      message: L[lang].PROPERTY_MEDIA_CREATED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23503") {
        logger.warn({
          route: req.originalUrl,
          message: "Property was not found",
          info: {
            requestId: req.id,
            userId: req.user.id,
            ip: req.ip,
            browser: req.headers["user-agent"],
          },
        });

        res.status(404).json({
          requestId: req.id,
          message: L[lang].PROPERTY_NOT_FOUND(),
          details: L[lang].PROPERTY_NOT_FOUND_DETAILS(),
        });

        return;
      }
    } else if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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

export async function getPropertyMedia(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const params = getItemByIdInputDTO.safeParse(req.params);

  if (!params.success) {
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

    const errors = params.error.errors;
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
    const property = await propertyService.getPropertyMedia(params.data.id);

    res.status(200).json({
      message: L[lang].PROPERTY_MEDIA_RETRIEVED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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

export async function deletePropertyMedia(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const params = getItemByIdInputDTO
    .merge(getMediaByIdInputDTO)
    .safeParse(req.params);

  if (!params.success) {
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
    const errors = params.error.errors;
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
    const property = await propertyService.deletePropertyMedia(
      params.data.id,
      params.data.mediaId,
    );

    if (!property.length) {
      logger.warn({
        route: req.originalUrl,
        message: "Property was not found or property has no media",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(404).json({
        requestId: req.id,
        message: `${L[lang].PROPERTY_NOT_FOUND()} or ${L[
          lang
        ].PROPERTY_HAS_NO_MEDIA()}`,
        details: L[lang].PROPERTY_IS_NOT_FOUND_OR_NO_MEDIA_DETAILS(),
      });

      return;
    }

    res.status(200).json({
      message: L[lang].PROPERTY_MEDIA_DELETED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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

export async function deleteProperty(req: Request, res: Response) {
  assertAuthenticated(req);
  const lang = req.locale.language as Locales;
  const params = getItemByIdInputDTO.safeParse(req.params);

  if (!params.success) {
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
    const errors = params.error.errors;
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
    const property = await propertyService.deletePropertyById(
      params.data.id,
      req.user.id,
    );

    if (!property) {
      logger.warn({
        route: req.originalUrl,
        message: "Property was not found",
        info: {
          requestId: req.id,
          userId: req.user.id,
          ip: req.ip,
          browser: req.headers["user-agent"],
        },
      });

      res.status(404).json({
        requestId: req.id,
        message: L[lang].PROPERTY_NOT_FOUND(),
        details: L[lang].PROPERTY_NOT_FOUND_DETAILS(),
      });

      return;
    }

    res.status(200).json({
      message: L[lang].PROPERTY_DELETED_SUCCESSFULLY(),
      data: property,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error: error.message,
          stack: error.stack,
          userId: req.user.id,
          browser: req.headers["user-agent"],
        },
      });
    } else {
      logger.error({
        route: req.originalUrl,
        message: "Internal server error",
        info: {
          requestId: req.id,
          error,
          userId: req.user.id,
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
