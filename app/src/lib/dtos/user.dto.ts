import { z } from "zod";

export const baseUserDTO = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(255),
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
