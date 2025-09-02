import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { commonFields } from "~/utils/common-fields";
import { HeartbeatStatus } from "../../../types/enums/heartbeats.enums";
import { projectsTable } from "./projects";

export const heartbeatsTable = pgTable("heartbeats", {
  ...commonFields(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id),
  receivedAt: timestamp("received_at").notNull(),
  status: varchar("status", { length: 32 }).$type<HeartbeatStatus>().notNull(),
});

export const heartbeatsTableRelations = relations(
  heartbeatsTable,
  ({ one }) => ({
    project: one(projectsTable, {
      fields: [heartbeatsTable.projectId],
      references: [projectsTable.id],
    }),
  }),
);

export type Heartbeat = typeof heartbeatsTable.$inferSelect;
export type NewHeartbeat = typeof heartbeatsTable.$inferInsert;
