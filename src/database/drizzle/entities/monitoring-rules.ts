import { eq, relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { commonFields } from "~/utils/common-fields";
import { projectsTable } from "./projects";

export const monitoringRulesTable = pgTable(
  "monitoring_rules",
  {
    ...commonFields(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id),
    checkIntervalSeconds: integer("check_interval_seconds").notNull(),
    timeoutThresholdSeconds: integer("timeout_threshold_seconds").notNull(),
    slackWebhookUrl: text("slack_webhook_url"),
    isActive: boolean("is_active").notNull(),
  },
  table => ({
    uniqueActiveRule: uniqueIndex()
      .on(table.projectId, table.isActive)
      .where(eq(table.isActive, true)),
  }),
);

export const monitoringRulesTableRelations = relations(
  monitoringRulesTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [monitoringRulesTable.projectId],
      references: [projectsTable.id],
    }),
  }),
);

export type MonitoringRule = typeof monitoringRulesTable.$inferSelect;
export type NewMonitoringRule = typeof monitoringRulesTable.$inferInsert;
