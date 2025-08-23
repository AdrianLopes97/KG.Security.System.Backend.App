import chalk from "chalk";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import "~/utils/load-env";
import { drizzle, pool } from ".";

async function main() {
  await migrate(drizzle, {
    migrationsFolder: path.resolve(
      process.cwd(),
      "src",
      "database",
      "drizzle",
      "migrations",
    ),
  });

  await pool.end();
  console.info(chalk.greenBright("✅ Finished migrating drizzle"));
}

main();
