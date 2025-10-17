import { relations } from "drizzle-orm";
import { json, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { ObservabilityLevels } from "~/types/enums/observabilities-levels.enums";
import { commonFields } from "~/utils/common-fields";
import { projectsTable } from "./projects";

export const projectLogsTable = pgTable("project_logs", {
  ...commonFields(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id),
  level: varchar("level", { length: 32 })
    .$type<ObservabilityLevels>()
    .notNull(),
  Message: text("message").notNull(),
  Stack: text("stack"),
  Name: varchar("name").notNull(),
  Origin: varchar("origin").notNull(),
  Stringified: text("stringified"),

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
