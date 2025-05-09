import { z } from "zod";

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

export const linkAccountDTO = z.discriminatedUnion("provider", [
  loginWithGoogleDTO.extend({
    provider: z.literal("google"),
  }),
  loginWithFacebookDTO.extend({
    provider: z.literal("facebook"),
  }),
]);

export const unlinkAccountDTO = z
  .object({
    provider: z.enum(["google", "facebook"]),
  })
  .strict();

export type LoginWithFacebookDTO = z.infer<typeof loginWithFacebookDTO>;
export type LoginWithGoogleDTO = z.infer<typeof loginWithGoogleDTO>;
export type LinkAccountDTO = z.infer<typeof linkAccountDTO>;
export type UnlinkAccountDTO = z.infer<typeof unlinkAccountDTO>;
