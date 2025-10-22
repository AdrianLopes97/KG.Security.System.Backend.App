import { desc, eq } from "drizzle-orm";
import { drizzle } from "~/database/drizzle";
import { heartbeatsTable } from "~/database/drizzle/entities";
import type { Heartbeat } from "~/database/drizzle/entities/heartbeats";

export async function getLatestHeartbeat(
  projectId: string,
): Promise<Heartbeat | null> {
  const hb = await drizzle.query.heartbeatsTable.findFirst({
    where: eq(heartbeatsTable.projectId, projectId),
    orderBy: desc(heartbeatsTable.receivedAt),
  });
  return hb ?? null;
}
