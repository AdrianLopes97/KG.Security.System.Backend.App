import { relations } from "drizzle-orm";
import {
  index,
  integer,
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
    title: varchar("title", { length: 255 }).notNull(),
    severity: varchar("severity", { length: 32 })
      .$type<VulnerabilitySeverity>()
      .notNull(),
    filePath: text("file_path"),
    lineNumber: integer("line_number"),
  },
  table => ({
    projectIdIdx: index().on(table.projectId),
    severityIdx: index().on(table.severity),
    filePathIdx: index().on(table.filePath),
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
