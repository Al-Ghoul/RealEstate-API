import { createSchemaFactory } from "drizzle-zod";
import { registry, zodInstance } from "../utils/swagger.utils";
import { profile } from "../db/schemas/profile.schema";

const { createInsertSchema } = createSchemaFactory({ zodInstance });

export const baseProfileDTO = createInsertSchema(profile, {
  firstName: (schema) => schema.openapi({ example: "John" }),
  lastName: (schema) => schema.openapi({ example: "Doe" }),
  createdAt: (schema) =>
    schema.openapi({ example: "2025-05-15 13:52:05.232193", format: "Date" }),
  updatedAt: (schema) =>
    schema.openapi({ example: "2025-05-15 13:52:05.232193", format: "Date" }),
});

registry.register("Profile", baseProfileDTO);
