import { eq } from "drizzle-orm";
import { drizzle } from "~/database/drizzle";
import { projectsTable } from "~/database/drizzle/entities";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";

export async function updateProjectStatus(
  projectId: string,
  status: UpTimeStatus,
): Promise<void> {
  await drizzle
    .update(projectsTable)
    .set({ upTimeStatus: status })
    .where(eq(projectsTable.id, projectId))
    .execute();
}
