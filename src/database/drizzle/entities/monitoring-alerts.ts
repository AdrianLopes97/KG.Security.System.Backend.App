import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { AlertChannel } from "~/types/enums/alert-channel.enums";
import { commonFields } from "~/utils/common-fields";
import { monitoringIncidentsTable } from "./monitoring-incidents";
import { projectsTable } from "./projects";

export const monitoringAlertsTable = pgTable(
  "monitoring_alerts",
  {
    ...commonFields(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => monitoringIncidentsTable.id),
    channel: text("channel").$type<AlertChannel>().notNull(),
    destination: text("destination"),
    sentAt: timestamp("sent_at").notNull(),
    payload: text("payload"),
    status: text("status"),
    error: text("error"),
  },
  table => ({
    byProjectSentAt: index("monitoring_alerts_project_id_sent_at_index").on(
      table.projectId,
      table.sentAt,
    ),
    byProjectIncident: index(
      "monitoring_alerts_project_id_incident_id_index",
    ).on(table.projectId, table.incidentId),
  }),
);

export const monitoringAlertsRelations = relations(
  monitoringAlertsTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [monitoringAlertsTable.projectId],
      references: [projectsTable.id],
    }),
    incident: one(monitoringIncidentsTable, {
      fields: [monitoringAlertsTable.incidentId],
      references: [monitoringIncidentsTable.id],
    }),
  }),
);

export type MonitoringAlert = typeof monitoringAlertsTable.$inferSelect;
export type NewMonitoringAlert = typeof monitoringAlertsTable.$inferInsert;
