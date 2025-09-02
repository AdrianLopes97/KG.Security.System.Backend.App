CREATE TABLE IF NOT EXISTS "heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"project_id" uuid NOT NULL,
	"received_at" timestamp NOT NULL,
	"status" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"project_id" uuid NOT NULL,
	"check_interval_seconds" integer NOT NULL,
	"timeout_threshold_seconds" integer NOT NULL,
	"is_active" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"project_id" uuid NOT NULL,
	"error_message" text,
	"error_stack" text,
	"error_name" varchar,
	"error_origin" varchar NOT NULL,
	"error_stringified" text,
	"info" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"github_url" text,
	"system_url" text,
	"up_time_status" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scan_process_queues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"project_id" uuid NOT NULL,
	"scan_type" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"requested_at" timestamp NOT NULL,
	"executed_at" timestamp,
	"error_stack" text,
	"error_name" varchar,
	"error_stringified" text,
	"error_info" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"phone_number" varchar NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"password" varchar,
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vulnerabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"scan_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"severity" varchar(32) NOT NULL,
	"file_path" text,
	"line_number" integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monitoring_rules_project_id_is_active_index" ON "monitoring_rules" ("project_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_process_queues_project_id_index" ON "scan_process_queues" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_process_queues_scan_type_index" ON "scan_process_queues" ("scan_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_process_queues_status_index" ON "scan_process_queues" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_process_queues_project_id_scan_type_status_index" ON "scan_process_queues" ("project_id","scan_type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_index" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_phone_number_index" ON "users" ("phone_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vulnerabilities_project_id_index" ON "vulnerabilities" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vulnerabilities_severity_index" ON "vulnerabilities" ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vulnerabilities_file_path_index" ON "vulnerabilities" ("file_path");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heartbeats" ADD CONSTRAINT "heartbeats_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitoring_rules" ADD CONSTRAINT "monitoring_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_logs" ADD CONSTRAINT "project_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scan_process_queues" ADD CONSTRAINT "scan_process_queues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_scan_id_scan_process_queues_id_fk" FOREIGN KEY ("scan_id") REFERENCES "scan_process_queues"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
