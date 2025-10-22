import { eq } from "drizzle-orm";
import { drizzle } from "~/database/drizzle";
import { monitoringIncidentsTable } from "~/database/drizzle/entities";

export async function updateOpenIncidentLastHeartbeat(
  incidentId: string,
  lastHeartbeatAt: Date,
): Promise<void> {
  await drizzle
    .update(monitoringIncidentsTable)
    .set({ lastHeartbeatAt })
    .where(eq(monitoringIncidentsTable.id, incidentId))
    .execute();
}
