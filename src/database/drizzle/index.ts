import { drizzle as DrizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "~/database/drizzle/entities";
import { env } from "~/env";

export const pool = new Pool({
  max: env.DATABASE_MAX_CONNECTIONS,
  connectionString: env.DATABASE_CONNECTION_STRING,
});

export const drizzle = DrizzlePostgres(pool, {
  schema,
  logger: env.DRIZZLE_LOGS,
});

export const drizzleWithLogs = DrizzlePostgres(pool, {
  schema,
  logger: true,
});

export type Drizzle = typeof drizzle;

export type DrizzleTransaction = Parameters<
  Parameters<typeof drizzle.transaction>[0]
>[0];
