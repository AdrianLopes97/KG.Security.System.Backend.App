CREATE TABLE IF NOT EXISTS "api_error_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"error_message" text,
	"error_stack" text,
	"error_name" varchar,
	"error_origin" varchar NOT NULL,
	"error_stringified" text,
	"info" json
);
--> statement-breakpoint
ALTER TABLE "vulnerabilities" RENAME COLUMN "title" TO "rule_id";--> statement-breakpoint
ALTER TABLE "vulnerabilities" ALTER COLUMN "file_path" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vulnerabilities" ALTER COLUMN "line_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scan_process_queues" ADD COLUMN "result_output_path" varchar;--> statement-breakpoint
ALTER TABLE "vulnerabilities" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vulnerabilities" ADD COLUMN "fingerprint" varchar(255);--> statement-breakpoint
ALTER TABLE "vulnerabilities" ADD COLUMN "priority_score" integer;--> statement-breakpoint
ALTER TABLE "vulnerabilities" ADD COLUMN "code_flow" json;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vulnerabilities_rule_id_index" ON "vulnerabilities" ("rule_id");