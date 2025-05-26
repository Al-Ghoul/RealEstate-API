import { createSchemaFactory } from "drizzle-zod";
import { property } from "../db/schemas/property.schema";
import { z } from "zod";
import { registry, zodInstance } from "../utils/swagger.utils";
import { propertyMedia } from "../db/schemas/propertyMedia.schema";

const { createInsertSchema } = createSchemaFactory({ zodInstance });

export const basePropertyDTO = createInsertSchema(property, {});

export const basePropertyMediaDTO = createInsertSchema(propertyMedia, {});

registry.register("PropertyMedia", basePropertyMediaDTO);

export const createPropertyMediaInputDTO = basePropertyMediaDTO.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePropertyMediaInputDTO = z.infer<
  typeof createPropertyMediaInputDTO
>;

const locationSchema = z
  .union([
    z.object({
      x: z.number(),
      y: z.number(),
    }),
    z.string().transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str) as { x: number; y: number } | null;
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          typeof parsed.x === "number" &&
          typeof parsed.y === "number"
        ) {
          return parsed;
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid location object shape",
          });
          return z.NEVER;
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON string",
        });
        return z.NEVER;
      }
    }),
  ])
  .refine((obj) => typeof obj.x === "number" && typeof obj.y === "number", {
    message: "Location must have numeric x and y",
  });

export const createPropertyInputDTO = basePropertyDTO
  .omit({
    id: true,
    userId: true,
    isFeatured: true,
    thumbnailURL: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    price: z.coerce.number().openapi({
      format: "float",
    }),
    location: locationSchema,
    rooms: z.coerce.number().min(0),
    area: z.coerce.number().min(0),
    isPublished: z.coerce.boolean().default(false),
  })
  .strict();
registry.register("Property", createPropertyInputDTO);

export type CreatePropertyInputDTO = z.infer<typeof createPropertyInputDTO>;

export const propertyQueryParams = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Limit the number of properties returned"),

  rooms: z.coerce
    .number()
    .min(1)
    .optional()
    .describe("Filter properties by number of rooms"),

  area: z.coerce
    .number()
    .min(1)
    .optional()
    .describe("Filter properties by area"),

  type: z
    .enum(property.type.enumValues)
    .optional()
    .describe("Filter properties by type"),

  status: z
    .enum(property.status.enumValues)
    .optional()
    .describe("Filter properties by status"),

  searchTerm: z
    .string()
    .optional()
    .describe("Search properties by name or description"),

  minPrice: z.coerce
    .number()
    .min(0)
    .optional()
    .describe("Filter properties by minimum price"),

  maxPrice: z.coerce
    .number()
    .min(0)
    .optional()
    .describe("Filter properties by maximum price"),

  longitude: z.coerce
    .number()
    .min(-180)
    .max(180)
    .optional()
    .describe("Filter properties by longitude"),

  latitude: z.coerce
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe("Filter properties by latitude"),

  radius: z.coerce
    .number()
    .min(0)
    .optional()
    .describe("Filter properties by radius (in kilometers, 1 = 1km)"),

  sortBy: z
    .enum(["price", "created_at"])
    .optional()
    .describe("Sort properties by price or created_at"),

  order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort properties in ascending or descending order"),

  cursor: z.coerce
    .number()
    .int()
    .optional()
    .default(0)
    .describe("Cursor ID to paginate after a specific property"),

  cursorCreatedAt: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined))
    .describe("Cursor created_at to paginate after a specific property"),
});

export const propertyQueryParamsSchema = propertyQueryParams.openapi({
  param: {
    in: "query",
  },
});

export const getItemByIdInputDTO = z
  .object({
    id: z.string().transform((value) => parseInt(value)),
  })
  .strict()
  .openapi({
    param: {
      in: "path",
    },
  });

export const getMediaByIdInputDTO = z
  .object({
    mediaId: z.string().transform((value) => parseInt(value)),
  })
  .strict()
  .openapi({
    param: {
      in: "path",
    },
  });

export type PropertyQueryParams = z.infer<typeof propertyQueryParams>;
