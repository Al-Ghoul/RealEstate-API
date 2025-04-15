import { z } from "zod";

export const loginUserDTO = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(255, { message: "Password must be less than 255 characters long" })
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
      message:
        "Password must only contain letters, numbers, and special characters",
    }),
});

export type LoginUserDTO = z.infer<typeof loginUserDTO>;

export const refreshTokenInputDTO = z
  .object({
    refreshToken: z.string(),
  })
  .strict()
  .refine((data) => data.refreshToken, {
    message: "Refresh token is required",
    path: ["refreshToken"],
  });

export type RefreshTokenInputDTO = z.infer<typeof refreshTokenInputDTO>;

export const requestEmailCodeDTO = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type RequestEmailCodeDTO = z.infer<typeof requestEmailCodeDTO>;
