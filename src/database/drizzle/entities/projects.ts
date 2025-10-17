import { relations } from "drizzle-orm";
import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";
import { commonFields } from "~/utils/common-fields";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  ...commonFields(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  githubUrl: text("github_url"),
  systemUrl: text("system_url"),
  upTimeStatus: varchar("up_time_status", { length: 32 })
    .$type<UpTimeStatus>()
    .notNull(),
  webhookKey: uuid("webhook_key").notNull(),
});

export const projectsTableRelations = relations(projectsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [projectsTable.userId],
    references: [usersTable.id],
  }),
}));

export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;
