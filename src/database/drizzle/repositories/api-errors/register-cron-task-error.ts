import { drizzle, DrizzleTransaction } from "~/database/drizzle";
import { cronTaskErrorLogsTable } from "~/database/drizzle/entities/cron-task-error-logs";
import { extractErrorInfo } from "~/utils/extract-error-info";

interface RegisterCronTaskErrorParams {
  error: unknown;
  name: string;
  info?: Record<string, any>;
  transaction?: DrizzleTransaction;
}

export async function registerCronTaskError({
  info,
  name,
  error,
  transaction,
}: RegisterCronTaskErrorParams) {
  const database = transaction ?? drizzle;

  await database
    .insert(cronTaskErrorLogsTable)
    .values({
      info,
      name,
      ...extractErrorInfo(error),
    })
    .execute();
}
