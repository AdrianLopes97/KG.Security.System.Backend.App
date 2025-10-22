import { Injectable } from "@nestjs/common";
import "~/dayjs";
import { env } from "~/env";
import { getActiveRules } from "~/utils/monitoring/get-active-rules";
import { processRule } from "~/utils/monitoring/process-rule";
import { CronTask } from "./cron-task";

@Injectable()
export class MonitoringCronService extends CronTask {
  interval = env.CRON_MONITORING_INTERVAL;
  disabled = env.CRON_MONITORING_DISABLED;

  async execute() {
    const now = new Date();
    try {
      console.log(`[${now.toISOString()}] Executing Monitoring cron task...`);
      const activeRules = await getActiveRules();
      if (!activeRules.length) {
        console.log("[MONITORING] Nenhuma regra ativa encontrada.");
        return;
      }
      for (const rule of activeRules) {
        await processRule(rule, now);
      }
    } catch (error) {
      console.error(
        `[${now.toISOString()}] Error executing Monitoring cron task:`,
        error,
      );
      await this.logError(error, {});
    }
  }
}
