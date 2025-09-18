import chalk from "chalk";
import { z } from "zod";
import "./utils/load-env";

const booleanSchema = z
  .string()
  .optional()
  .transform(value => value === "true");

const envSchema = z.object({
  PORT: z.coerce.number().optional().default(4010),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("production"),
  SERVER_URL: z.string().url(),
  TIMEZONE: z.string().optional().default("America/Sao_Paulo"),
  VERBOSE_MODE: booleanSchema,
  ENABLE_REQUEST_LOGS: booleanSchema,

  // CRON tasks
  RUN_CRON_TASKS_IN_DEVELOPMENT: booleanSchema,
  CRON_DISABLE_ALL: booleanSchema,
  CRON_SAST_DISABLED: booleanSchema,
  CRON_SAST_INTERVAL: z.string().default("*/5 * * * *"), // a cada 5 minutos

  // Crypto
  CRYPTO_SECRET_KEY: z.string(),
  CRYPTO_SECRET_IV: z.string(),

  // JWT
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_SECRET: z.string(),

  // Drizzle
  DATABASE_CONNECTION_STRING: z.string().url(),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().optional(),
  DRIZZLE_LOGS: booleanSchema,

  // Frontend web urls
  FRONTEND_WEB_BASE_URL: z.string().url(),

  // Snyk
  SNYK_TOKEN: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    chalk.red("Invalid environment variables"),
    parsedEnv.error.flatten().fieldErrors,
  );

  throw new Error("Invalid environment variables");
}

const env = parsedEnv.data;
export { env, envSchema };
