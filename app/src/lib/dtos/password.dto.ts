import { z } from "zod";
import { verifyUserDTO } from "./verify.dto";
import { baseUserDTO } from "./user.dto";

export const passwordResetDTO = verifyUserDTO
  .merge(
    baseUserDTO.pick({
      password: true,
      confirmPassword: true,
    }),
  )
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const changePasswordDTO = baseUserDTO
  .pick({
    password: true,
    confirmPassword: true,
  })
  .extend({
    currentPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const setPasswordDTO = baseUserDTO
  .pick({
    password: true,
    confirmPassword: true,
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export type PasswordResetDTO = z.infer<typeof passwordResetDTO>;
export type ChangePasswordDTO = z.infer<typeof changePasswordDTO>;
export type SetPasswordDTO = z.infer<typeof setPasswordDTO>;
