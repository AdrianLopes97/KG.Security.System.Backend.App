import { env } from "~/env";

export function isCronDisabled(disabled: boolean): boolean {
  if (env.NODE_ENV === "development" && !env.RUN_CRON_TASKS_IN_DEVELOPMENT) {
    return true;
  }

  if (env.CRON_DISABLE_ALL) {
    return true;
  }

  return disabled;
}
