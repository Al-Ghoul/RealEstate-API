import { z } from "zod";

export const createUserDTO = z
  .object({
    email: z.string().email(),
    password: z.string(),
    confirmPassword: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

export type CreateUserDTO = z.infer<typeof createUserDTO>;
