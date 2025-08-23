import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import path from "node:path";
import { AppLoggerMiddleware } from "./api/middlewares/logger.middleware";
import { env } from "./env";
import { importer } from "./importer";

const controllers = importer({
  suffix: "Controller",
  path: path.resolve(__dirname, "api", "swagger", "controllers"),
});

const services = importer({
  suffix: "Service",
  path: path.resolve(__dirname, "services"),
});

const coreServices = importer({
  suffix: "Service",
  path: path.resolve(__dirname, "api", "core"),
});

const cronTasks = importer({
  suffix: "Service",
  path: path.resolve(__dirname, "cron-tasks"),
});

const gateways = importer({
  suffix: "Gateway",
  path: path.resolve(__dirname, "gateways"),
});

const handlers = importer({
  suffix: "Handler",
  path: path.resolve(__dirname, "handlers"),
});

@Module({
  controllers,
  providers: [
    ...services,
    ...coreServices,
    ...cronTasks,
    ...gateways,
    ...handlers,
  ],

  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        limit: 10,
        ttl: 60000,
      },
    ]),
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    if (env.ENABLE_REQUEST_LOGS) {
      consumer.apply(AppLoggerMiddleware).forRoutes("*");
    }
  }
}
