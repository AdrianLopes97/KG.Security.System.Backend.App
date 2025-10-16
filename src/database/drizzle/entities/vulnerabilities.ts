import { relations } from "drizzle-orm";
import {
  index,
  integer,
  json,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { commonFields } from "~/utils/common-fields";
import { VulnerabilitySeverity } from "../../../types/enums/vulnerabilities.enums";
import { projectsTable } from "./projects";
import { scanProcessQueuesTable } from "./scan-process-queues";

export const vulnerabilitiesTable = pgTable(
  "vulnerabilities",
  {
    ...commonFields(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scanProcessQueuesTable.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id),
    ruleId: varchar("rule_id", { length: 255 }).notNull(),
    severity: varchar("severity", { length: 32 })
      .$type<VulnerabilitySeverity>()
      .notNull(),
    description: text("description").notNull(),
    filePath: text("file_path").notNull(),
    lineNumber: integer("line_number").notNull(),
    fingerprint: varchar("fingerprint", { length: 255 }),
    priorityScore: integer("priority_score"),
    codeFlow: json("code_flow"),
  },
  table => ({
    projectIdIdx: index().on(table.projectId),
    severityIdx: index().on(table.severity),
    filePathIdx: index().on(table.filePath),
    ruleIdIdx: index().on(table.ruleId),
    // Para identidade por fingerprint e ordenação pelo mais recente
    projectFingerprintCreatedAtIdx: index(
      "vuln_project_fingerprint_created_at_idx",
    ).on(table.projectId, table.fingerprint, table.createdAt),

    // Para fallback: ruleId + filePath + lineNumber e ordenação pelo mais recente
    projectRuleFileLineCreatedAtIdx: index(
      "vuln_project_rule_file_line_created_at_idx",
    ).on(
      table.projectId,
      table.ruleId,
      table.filePath,
      table.lineNumber,
      table.createdAt,
    ),
  }),
);

export const vulnerabilitiesTableRelations = relations(
  vulnerabilitiesTable,
  ({ one }) => ({
    scan: one(scanProcessQueuesTable, {
      fields: [vulnerabilitiesTable.scanId],
      references: [scanProcessQueuesTable.id],
    }),
    project: one(projectsTable, {
      fields: [vulnerabilitiesTable.projectId],
      references: [projectsTable.id],
    }),
  }),
);

export type Vulnerability = typeof vulnerabilitiesTable.$inferSelect;
export type NewVulnerability = typeof vulnerabilitiesTable.$inferInsert;
