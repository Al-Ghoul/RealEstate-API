import { z } from "zod";
import { roleType } from "../db/schemas/role.schema";
import { createSchemaFactory } from "drizzle-zod";
import { registry, zodInstance } from "../utils/swagger.utils";
import { user } from "../db/schemas/user.schema";
import { baseProfileDTO } from "./profile.dto";

const { createInsertSchema } = createSchemaFactory({
  zodInstance,
  coerce: {
    date: true,
  },
});

export const baseUserDTO = createInsertSchema(user, {
  email: (schema) =>
    schema.email().openapi({ example: "9YsD0@example.com", format: "email" }),
  password: (schema) => schema.openapi({ example: "password" }),
  emailVerified: (schema) =>
    schema.openapi({ example: "2025-05-15 13:52:05.232193", format: "Date" }),
  createdAt: (schema) =>
    schema.openapi({ example: "2025-05-15 13:52:05.232193", format: "Date" }),
  updatedAt: (schema) =>
    schema.openapi({ example: "2025-05-15 13:52:05.232193", format: "Date" }),
});

registry.register("User", baseUserDTO.omit({ password: true }));

export const createUserInputDTO = z
  .object({
    email: baseUserDTO.shape.email.unwrap(),
    firstName: baseProfileDTO.shape.firstName.unwrap(),
    lastName: baseProfileDTO.shape.lastName.unwrap(),
    password: baseUserDTO.shape.password.unwrap(),
    confirmPassword: baseUserDTO.shape.password.unwrap(),
    role: z.enum(roleType.enumValues).exclude(["admin"]),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const updateUserDTO = baseUserDTO
  .pick({
    email: true,
  })
  .partial()
  .strict();

export const updateUserProfileDTO = baseProfileDTO
  .pick({
    firstName: true,
    lastName: true,
    bio: true,
  })
  .strict();

export type CreateUserInputDTO = z.infer<typeof createUserInputDTO>;
export type UpdateUserDTO = z.infer<typeof updateUserDTO>;
export type UpdateUserProfileDTO = z.infer<typeof updateUserProfileDTO>;
