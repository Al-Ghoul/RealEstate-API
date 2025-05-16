import { createSchemaFactory } from "drizzle-zod";
import { property } from "../db/schemas/property.schema";
import { z } from "zod";
import { registry, zodInstance } from "../utils/swagger.utils";

const { createInsertSchema } = createSchemaFactory({ zodInstance });

export const createPropertyInputDTO = createInsertSchema(property, {
  title: (schema) => schema.openapi({ example: "Some title" }),
});
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
    in: "path",
  },
});

export type PropertyQueryParams = z.infer<typeof propertyQueryParams>;
