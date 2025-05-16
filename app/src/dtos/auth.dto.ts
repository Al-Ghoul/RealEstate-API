import { z } from "zod";
import { baseUserDTO } from "./user.dto";

export const loginUserInputDTO = z
  .object({
    email: baseUserDTO.shape.email.unwrap(),
    password: baseUserDTO.shape.password.unwrap(),
  })
  .strict();

export const refreshTokenInputDTO = z
  .object({
    refreshToken: z.string().jwt(),
  })
  .strict();

export const codeInputDTO = z
  .object({
    code: z
      .string()
      .regex(/^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$/)
      .openapi({
        example: "12X-4X6",
      }),
  })
  .strict();

export const loginWithFacebookDTO = z
  .object({
    accessToken: z.string(),
  })
  .strict();

export const loginWithGoogleDTO = z
  .object({
    idToken: z.string(),
  })
  .strict();

export const requestResetCodeDTO = z
  .object({
    email: baseUserDTO.shape.email.unwrap(),
  })
  .strict();

export const passwordResetInputDTO = codeInputDTO
  .merge(
    z.object({
      password: baseUserDTO.shape.password.unwrap(),
      confirmPassword: baseUserDTO.shape.password.unwrap(),
    }),
  )
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const changePasswordInputDTO = z
  .object({
    password: baseUserDTO.shape.password.unwrap(),
    currentPassword: baseUserDTO.shape.password.unwrap(),
    confirmPassword: baseUserDTO.shape.password.unwrap(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const setPasswordInputDTO = z
  .object({
    password: baseUserDTO.shape.password.unwrap(),
    confirmPassword: baseUserDTO.shape.password.unwrap(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export type PasswordResetInputDTO = z.infer<typeof passwordResetInputDTO>;
export type ChangePasswordInputDTO = z.infer<typeof changePasswordInputDTO>;
export type SetPasswordInputDTO = z.infer<typeof setPasswordInputDTO>;

export type RequestResetCodeDTO = z.infer<typeof requestResetCodeDTO>;

export type LoginUserInputDTO = z.infer<typeof loginUserInputDTO>;

export type RefreshTokenInputDTO = z.infer<typeof refreshTokenInputDTO>;
export type CodeInputDTO = z.infer<typeof codeInputDTO>;

export type LoginWithFacebookDTO = z.infer<typeof loginWithFacebookDTO>;
export type LoginWithGoogleDTO = z.infer<typeof loginWithGoogleDTO>;
