import { relations } from "drizzle-orm";
import {
  index,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { ScanStatus } from "~/types/enums/scan-status.enums";
import { ScanType } from "~/types/enums/scan-type.enums";
import { commonFields } from "~/utils/common-fields";
import { projectsTable } from "./projects";

export const scanProcessQueuesTable = pgTable(
  "scan_process_queues",
  {
    ...commonFields(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id),
    scanType: varchar("scan_type", { length: 32 }).$type<ScanType>().notNull(),
    status: varchar("status", { length: 32 }).$type<ScanStatus>().notNull(),
    resultOutputPath: varchar("result_output_path"),
    requestedAt: timestamp("requested_at").notNull(),
    executedAt: timestamp("executed_at"),
    errorStack: text("error_stack"),
    errorName: varchar("error_name"),
    errorStringified: text("error_stringified"),
    errorInfo: json("error_info").$type<Record<string, any>>(),
  },
  table => ({
    projectIdIdx: index().on(table.projectId),
    scanTypeIdx: index().on(table.scanType),
    statusIdx: index().on(table.status),
    projectScanTypeStatusIdx: index().on(
      table.projectId,
      table.scanType,
      table.status,
    ),
  }),
);

export const scanProcessQueuesTableRelations = relations(
  scanProcessQueuesTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [scanProcessQueuesTable.projectId],
      references: [projectsTable.id],
    }),
  }),
);

export type Scan = typeof scanProcessQueuesTable.$inferSelect;
export type NewScan = typeof scanProcessQueuesTable.$inferInsert;
