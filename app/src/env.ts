import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  TOKEN_ISSUER: z.string(),
  JWT_SECRET: z.string(),
  JWT_KEY: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number),
});

export const env = envSchema.parse(process.env);
