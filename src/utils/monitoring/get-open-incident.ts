import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "~/database/drizzle";
import { monitoringIncidentsTable } from "~/database/drizzle/entities";
import type { MonitoringIncident } from "~/database/drizzle/entities/monitoring-incidents";

export async function getOpenIncident(
  projectId: string,
): Promise<MonitoringIncident | null> {
  const row = await drizzle.query.monitoringIncidentsTable.findFirst({
    where: and(
      eq(monitoringIncidentsTable.projectId, projectId),
      eq(monitoringIncidentsTable.isOpen, true),
    ),
    orderBy: desc(monitoringIncidentsTable.startedAt),
  });
  return row ?? null;
}
