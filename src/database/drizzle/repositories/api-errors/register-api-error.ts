import { drizzle, DrizzleTransaction } from "~/database/drizzle";
import { extractErrorInfo } from "~/utils/extract-error-info";
import { getCallerInfo } from "~/utils/get-caller-info";
import { apiErrorLogsTable } from "../../entities";

interface RegisterApiErrorParams {
  error: unknown;
  origin?: string;
  clientId?: string;
  info?: Record<string, any>;
  transaction?: DrizzleTransaction;
}

export async function registerApiError({
  info,
  error,
  origin,
  transaction,
}: RegisterApiErrorParams) {
  const database = transaction ?? drizzle;

  await database
    .insert(apiErrorLogsTable)
    .values({
      info,
      errorOrigin: origin ?? getCallerInfo(),
      ...extractErrorInfo(error),
    })
    .execute();
}
