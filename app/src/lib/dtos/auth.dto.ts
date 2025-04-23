import { z } from "zod";

export const loginUserDTO = z
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
  })
  .strict();

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

export const verifyUserDTO = z
  .object({
    code: z.string(),
  })
  .strict();

export type VerifyUserDTO = z.infer<typeof verifyUserDTO>;

export const requestResetCodeDTO = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type RequestResetCodeDTO = z.infer<typeof requestResetCodeDTO>;

export const passwordResetDTO = z
  .object({
    code: z.string(),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(255, { message: "Password must be less than 255 characters long" })
      .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
        message:
          "Password must only contain letters, numbers, and special characters",
      }),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordResetDTO = z.infer<typeof passwordResetDTO>;

export const changePasswordDTO = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(255, { message: "Password must be less than 255 characters long" })
      .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
        message:
          "Password must only contain letters, numbers, and special characters",
      }),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordDTO = z.infer<typeof changePasswordDTO>;

export const setPasswordDTO = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(255, { message: "Password must be less than 255 characters long" })
      .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
        message:
          "Password must only contain letters, numbers, and special characters",
      }),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetPasswordDTO = z.infer<typeof setPasswordDTO>;

export const loginWithFacebookDTO = z
  .object({
    accessToken: z.string(),
  })
  .strict();

export type LoginWithFacebookDTO = z.infer<typeof loginWithFacebookDTO>;

export const linkAccountDTO = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("google"),
    idToken: z.string(),
  }),
  z.object({
    provider: z.literal("facebook"),
    accessToken: z.string(),
  }),
]);

export type LinkAccountDTO = z.infer<typeof linkAccountDTO>;

export const unlinkAccountDTO = z
  .object({
    provider: z.enum(["google", "facebook"]),
  })
  .strict();

export type UnlinkAccountDTO = z.infer<typeof unlinkAccountDTO>;

export const loginWithGoogleDTO = z
  .object({
    idToken: z.string(),
  })
  .strict();

export type LoginWithGoogleDTO = z.infer<typeof loginWithGoogleDTO>;
