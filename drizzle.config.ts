import type { Config } from "drizzle-kit";
import { env } from "~/env";

export default {
  schema: "./src/database/drizzle/entities/index.ts",
  out: "./src/database/drizzle/migrations",
  driver: "pg",
  verbose: true,
  dbCredentials: {    
    connectionString: env.DATABASE_CONNECTION_STRING,
  },
} satisfies Config;
