import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  TOKEN_ISSUER: z.string(),
  JWT_SECRET: z.string(),
  JWT_KEY: z.string(),
  TOKEN_AUDIENCE: z.string(),
  GMAIL_USER: z.string(),
  GMAIL_PASSWORD: z.string(),
  FACEBOOK_APP_ID: z.string(),
  FACEBOOK_APP_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  REDIS_URL: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number),
  WS_PORT: z.string().transform(Number),
  DOMAIN: z.string().url(),
});

export const env = envSchema.parse(process.env);
