import {
  bigserial,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const apiErrorLogsTable = pgTable("api_error_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),

  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  errorName: varchar("error_name"),
  errorOrigin: varchar("error_origin").notNull(),
  errorStringified: text("error_stringified"),

  info: json("info").$type<Record<string, any>>(),
});

export type ApiErrorLog = typeof apiErrorLogsTable.$inferSelect;
export type NewApiErrorLog = typeof apiErrorLogsTable.$inferInsert;
