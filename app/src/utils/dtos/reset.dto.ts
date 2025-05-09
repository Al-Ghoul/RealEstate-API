import { z } from "zod";
import { baseUserDTO } from "./user.dto";

export const requestResetCodeDTO = baseUserDTO
  .pick({
    email: true,
  })
  .strict();

export type RequestResetCodeDTO = z.infer<typeof requestResetCodeDTO>;
