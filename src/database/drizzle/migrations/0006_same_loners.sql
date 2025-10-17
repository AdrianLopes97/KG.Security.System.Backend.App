ALTER TABLE "project_logs" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "project_logs" ADD COLUMN "stack" text;--> statement-breakpoint
ALTER TABLE "project_logs" ADD COLUMN "name" varchar;--> statement-breakpoint
ALTER TABLE "project_logs" ADD COLUMN "origin" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "project_logs" ADD COLUMN "stringified" text;--> statement-breakpoint
ALTER TABLE "project_logs" DROP COLUMN IF EXISTS "error_message";--> statement-breakpoint
ALTER TABLE "project_logs" DROP COLUMN IF EXISTS "error_stack";--> statement-breakpoint
ALTER TABLE "project_logs" DROP COLUMN IF EXISTS "error_name";--> statement-breakpoint
ALTER TABLE "project_logs" DROP COLUMN IF EXISTS "error_origin";--> statement-breakpoint
ALTER TABLE "project_logs" DROP COLUMN IF EXISTS "error_stringified";