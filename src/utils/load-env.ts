import { config } from "dotenv";

// carrega .env base
config({ path: `${process.cwd()}/.env` });
// carrega .env por ambiente (development, production ou test)
config({
  path: `${process.cwd()}/.env.${process.env.NODE_ENV}`,
  override: true,
});
