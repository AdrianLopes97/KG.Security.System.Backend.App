import { eq, relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { commonFields } from "~/utils/common-fields";
import { projectsTable } from "./projects";

export const monitoringIncidentsTable = pgTable(
  "monitoring_incidents",
  {
    ...commonFields(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
    isOpen: boolean("is_open").notNull().default(true),
    durationSeconds: integer("duration_seconds"),
    lastHeartbeatAt: timestamp("last_heartbeat_at"),
    reason: text("reason"),
  },
  table => ({
    oneOpenIncidentByProject: uniqueIndex()
      .on(table.projectId, table.isOpen)
      .where(eq(table.isOpen, true)),
    byProjectStartedAt: index(
      "monitoring_incidents_project_id_started_at_index",
    ).on(table.projectId, table.startedAt),
    byProjectEndedAt: index(
      "monitoring_incidents_project_id_ended_at_index",
    ).on(table.projectId, table.endedAt),
  }),
);

export const monitoringIncidentsRelations = relations(
  monitoringIncidentsTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [monitoringIncidentsTable.projectId],
      references: [projectsTable.id],
    }),
  }),
);

export type MonitoringIncident = typeof monitoringIncidentsTable.$inferSelect;
export type NewMonitoringIncident =
  typeof monitoringIncidentsTable.$inferInsert;
