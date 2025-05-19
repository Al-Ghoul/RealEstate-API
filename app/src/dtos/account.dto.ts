import { z } from "zod";
import { loginWithFacebookDTO, loginWithGoogleDTO } from "./auth.dto";
import { createSchemaFactory } from "drizzle-zod";
import { registry, zodInstance } from "../utils/swagger.utils";
import { account } from "../db/schemas/account.schema";

const { createInsertSchema } = createSchemaFactory({
  zodInstance,
  coerce: {
    date: true,
  },
});

export const accountSchema = createInsertSchema(account, {
  provider: (schema) => schema.openapi({ example: "google" }),
  providerAccountId: (schema) => schema.openapi({ example: "123456789" }),
  updatedAt: (schema) =>
    schema.openapi({ example: "2025-05-15 13:52:05.232193", format: "Date" }),
  createdAt: (schema) =>
    schema.openapi({ example: "2025-05-15 13:52:05.232193", format: "Date" }),
});

registry.register("Account", accountSchema);

export const linkAccountDTO = z.discriminatedUnion("provider", [
  loginWithGoogleDTO.extend({
    provider: z.literal("google"),
  }),
  loginWithFacebookDTO.extend({
    provider: z.literal("facebook"),
  }),
]);

export const unlinkAccountInputDTO = z
  .object({
    provider: z.enum(["google", "facebook"]),
  })
  .openapi({
    param: {
      in: "path",
    },
  });

export type LinkAccountDTO = z.infer<typeof linkAccountDTO>;
export type UnlinkAccountInputDTO = z.infer<typeof unlinkAccountInputDTO>;
