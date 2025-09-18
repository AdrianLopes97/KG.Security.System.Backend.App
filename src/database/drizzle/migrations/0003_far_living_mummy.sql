CREATE TABLE IF NOT EXISTS "cron_task_error_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"name" varchar NOT NULL,
	"error_message" text,
	"error_stack" text,
	"error_name" varchar,
	"error_stringified" text,
	"info" json
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cron_task_error_logs_name_index" ON "cron_task_error_logs" ("name");