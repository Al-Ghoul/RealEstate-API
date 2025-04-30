import { z } from "zod";

export const baseUserDTO = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(255, { message: "Password must be less than 255 characters long" })
      .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
        message:
          "Password must only contain letters, numbers, and special characters",
      }),
    confirmPassword: z.string(),
  })
  .strict();

const baseProfileDTO = z
  .object({
    firstName: z.string().min(2).max(16),
    lastName: z.string().min(2).max(16),
    bio: z.string().max(255),
  })
  .strict();

export const createUserDTO = baseProfileDTO
  .pick({
    firstName: true,
    lastName: true,
  })
  .merge(baseUserDTO)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
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

export type CreateUserDTO = z.infer<typeof createUserDTO>;
export type UpdateUserDTO = z.infer<typeof updateUserDTO>;
export type UpdateUserProfileDTO = z.infer<typeof updateUserProfileDTO>;
