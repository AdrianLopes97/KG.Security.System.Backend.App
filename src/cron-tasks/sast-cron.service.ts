import { Injectable } from "@nestjs/common";
import { env } from "~/env";
import { CronTask } from "./cron-task";

@Injectable()
export class SystemDispatchCronService extends CronTask {
  interval = env.CRON_SAST_INTERVAL;
  disabled = env.CRON_SAST_DISABLED;

  async execute() {
    try {
    } catch (error) {
      await this.logError(error, {});
    }
  }
}
