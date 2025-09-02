import { relations } from "drizzle-orm";
import { json, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { commonFields } from "~/utils/common-fields";
import { projectsTable } from "./projects";

export const projectLogsTable = pgTable("project_logs", {
  ...commonFields(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id),
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  errorName: varchar("error_name"),
  errorOrigin: varchar("error_origin").notNull(),
  errorStringified: text("error_stringified"),

  info: json("info").$type<Record<string, any>>(),
});

export const projectLogsTableRelations = relations(
  projectLogsTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [projectLogsTable.projectId],
      references: [projectsTable.id],
    }),
  }),
);

export type ProjectLog = typeof projectLogsTable.$inferSelect;
export type NewProjectLog = typeof projectLogsTable.$inferInsert;
