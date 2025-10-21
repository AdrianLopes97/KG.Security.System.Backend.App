CREATE TABLE IF NOT EXISTS "monitoring_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"project_id" uuid NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"is_open" boolean DEFAULT true NOT NULL,
	"duration_seconds" integer,
	"last_heartbeat_at" timestamp,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitoring_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"updated_at" timestamp DEFAULT (now() at time zone 'utc') NOT NULL,
	"deleted_at" timestamp,
	"project_id" uuid NOT NULL,
	"incident_id" uuid NOT NULL,
	"channel" text,
	"destination" text,
	"sent_at" timestamp NOT NULL,
	"payload" text,
	"status" text,
	"error" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monitoring_incidents_project_id_is_open_index" ON "monitoring_incidents" ("project_id","is_open");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitoring_incidents" ADD CONSTRAINT "monitoring_incidents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitoring_alerts" ADD CONSTRAINT "monitoring_alerts_incident_id_monitoring_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "monitoring_incidents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
