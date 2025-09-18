import {
  bigserial,
  index,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const cronTaskErrorLogsTable = pgTable(
  "cron_task_error_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),

    name: varchar("name").notNull(),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    errorName: varchar("error_name"),
    errorStringified: text("error_stringified"),

    info: json("info").$type<Record<string, any>>(),
  },
  table => ({
    nameIndex: index().on(table.name),
  }),
);

export type CronTaskErrorLog = typeof cronTaskErrorLogsTable.$inferSelect;
export type NewCronTaskErrorLog = typeof cronTaskErrorLogsTable.$inferInsert;
