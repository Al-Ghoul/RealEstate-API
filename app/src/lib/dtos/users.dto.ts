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
    firstName: z.string(),
    lastName: z.string(),
  })
  .strict();

export const createUserDTO = baseUserDTO.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  },
);

export type CreateUserDTO = z.infer<typeof createUserDTO>;

export const updateUserDTO = baseUserDTO
  .pick({
    email: true,
    firstName: true,
    lastName: true,
  })
  .partial()
  .strict();

export type UpdateUserDTO = z.infer<typeof updateUserDTO>;
