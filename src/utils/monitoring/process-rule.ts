import type { MonitoringRule } from "~/database/drizzle/entities/monitoring-rules";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";
import { closeIncidentAndAlert } from "./close-incident-and-alert";
import { computeDownStatus } from "./compute-down-status";
import { getLatestHeartbeat } from "./get-latest-heartbeat";
import { getOpenIncident } from "./get-open-incident";
import { openIncidentAndAlert } from "./open-incident-and-alert";
import { updateOpenIncidentLastHeartbeat } from "./update-open-incident-last-heartbeat";
import { updateProjectStatus } from "./update-project-status";

export async function processRule(
  rule: MonitoringRule,
  now: Date,
): Promise<void> {
  const projectId = rule.projectId;
  const latestHeartbeat = await getLatestHeartbeat(projectId);

  if (!latestHeartbeat) {
    await updateProjectStatus(projectId, UpTimeStatus.UNKNOWN);
    return;
  }

  const evaluation = computeDownStatus(rule, latestHeartbeat, now);
  const openIncident = await getOpenIncident(projectId);

  if (evaluation.isDown) {
    if (openIncident) {
      await updateProjectStatus(projectId, UpTimeStatus.DOWN);
      await updateOpenIncidentLastHeartbeat(
        openIncident.id,
        latestHeartbeat.receivedAt,
      );
    } else {
      await openIncidentAndAlert(
        rule,
        projectId,
        latestHeartbeat,
        evaluation,
        now,
      );
    }
    return;
  }

  // System considered UP
  if (openIncident) {
    await closeIncidentAndAlert(
      rule,
      projectId,
      openIncident,
      latestHeartbeat,
      now,
    );
  } else {
    await updateProjectStatus(projectId, UpTimeStatus.UP);
  }
}
