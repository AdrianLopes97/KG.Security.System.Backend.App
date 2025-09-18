import { Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { registerCronTaskError } from "~/database/drizzle/repositories/api-errors/register-cron-task-error";
import { env } from "~/env";
import { isCronDisabled } from "~/utils/is-cron-disabled";

const schedulerRegistry = new SchedulerRegistry();

export abstract class CronTask {
  protected isRunning = false;
  protected readonly logger: Logger;
  protected abstract readonly interval: string;
  protected abstract readonly disabled: boolean;
  protected readonly testing?: boolean | { interval: string };

  abstract execute(): any;

  constructor() {
    this.logger = new Logger(this.constructor.name);
    // timeout para esperar construir a classe e ter acesso a propriedades abstract
    setTimeout(() => {
      this.register();
    }, 0);
  }

  private register() {
    const isDisabled = isCronDisabled(this.disabled);
    const interval = this.testing
      ? typeof this.testing === "boolean"
        ? "* * * * *"
        : this.testing.interval
      : this.interval;

    if (isDisabled && !this.testing) {
      this.logger.warn("DISABLED");
    } else {
      const job = CronJob.from({
        start: true,
        cronTime: interval,
        timeZone: env.TIMEZONE,
        onTick: this.run.bind(this),
      });

      // @ts-expect-error
      schedulerRegistry.addCronJob(this.constructor.name, job);

      this.logger.log(
        `Mapped with interval ${interval}${this.testing ? " (testing)" : ""}`,
      );
    }
  }

  protected async logError(error: unknown, info?: Record<string, any>) {
    if (env.VERBOSE_MODE) {
      this.logger.error("Error");
      console.error(error);
    }

    await registerCronTaskError({
      info,
      error,
      name: this.constructor.name,
    }).catch(console.error);
  }

  private async run() {
    if (this.isRunning) {
      if (env.VERBOSE_MODE) {
        this.logger.warn("Skipping because it is already running");
      }

      return;
    }

    this.isRunning = true;

    if (env.VERBOSE_MODE) {
      this.logger.log("Running");
      console.time(this.constructor.name);
    }

    try {
      await this.execute();
    } catch (error) {
      await this.logError(error);
    } finally {
      this.isRunning = false;

      if (env.VERBOSE_MODE) {
        this.logger.log("Finished");
        console.timeEnd(this.constructor.name);
      }
    }
  }
}
