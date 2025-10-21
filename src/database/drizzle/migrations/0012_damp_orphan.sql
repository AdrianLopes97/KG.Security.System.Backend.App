CREATE INDEX IF NOT EXISTS "monitoring_incidents_project_id_started_at_index" ON "monitoring_incidents" ("project_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_incidents_project_id_ended_at_index" ON "monitoring_incidents" ("project_id","ended_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alerts_project_id_sent_at_index" ON "monitoring_alerts" ("project_id","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitoring_alerts_project_id_incident_id_index" ON "monitoring_alerts" ("project_id","incident_id");