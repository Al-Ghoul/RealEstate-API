import { z } from "zod";

export const verifyUserDTO = z
  .object({
    code: z.string(),
  })
  .strict();

export type VerifyUserDTO = z.infer<typeof verifyUserDTO>;
