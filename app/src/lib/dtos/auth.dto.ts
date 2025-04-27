import { z } from "zod";
import { baseUserDTO } from "./user.dto";

export const loginUserDTO = baseUserDTO
  .pick({
    email: true,
    password: true,
  })
  .strict();

export const refreshTokenInputDTO = z
  .object({
    refreshToken: z.string(),
  })
  .strict();

export type LoginUserDTO = z.infer<typeof loginUserDTO>;
export type RefreshTokenInputDTO = z.infer<typeof refreshTokenInputDTO>;
