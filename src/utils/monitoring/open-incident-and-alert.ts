import { drizzle } from "~/database/drizzle";
import {
  monitoringAlertsTable,
  monitoringIncidentsTable,
} from "~/database/drizzle/entities";
import type { Heartbeat } from "~/database/drizzle/entities/heartbeats";
import type { MonitoringRule } from "~/database/drizzle/entities/monitoring-rules";
import { AlertChannel } from "~/types/enums/alert-channel.enums";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";
import type { DownEvaluation, SlackMessage } from "~/types/monitoring.types";
import { sendSlackMessage } from "../send-slack-message";
import { updateProjectStatus } from "./update-project-status";

export async function openIncidentAndAlert(
  rule: MonitoringRule,
  projectId: string,
  latestHeartbeat: Heartbeat,
  evaluation: DownEvaluation,
  now: Date,
): Promise<void> {
  const [inserted] = await drizzle
    .insert(monitoringIncidentsTable)
    .values({
      projectId,
      startedAt: latestHeartbeat.receivedAt ?? now,
      isOpen: true,
      lastHeartbeatAt: latestHeartbeat.receivedAt,
      reason: evaluation.reason,
    })
    .returning({ id: monitoringIncidentsTable.id });

  await updateProjectStatus(projectId, UpTimeStatus.DOWN);

  if (rule.slackWebhookUrl) {
    const payload: SlackMessage = {
      text: `:rotating_light: Projeto ${projectId} DOWN. Motivo: ${evaluation.reason}. Último heartbeat há ${evaluation.secondsSinceLast}s.`,
    };
    const { delivered, statusCode, responseBody, error } =
      await sendSlackMessage(rule.slackWebhookUrl, payload);

    await drizzle.insert(monitoringAlertsTable).values({
      projectId,
      incidentId: inserted.id,
      channel: AlertChannel.SLACK,
      destination: rule.slackWebhookUrl,
      sentAt: new Date(),
      payload: JSON.stringify(payload),
      status: delivered ? `SENT(${statusCode})` : `FAILED(${statusCode})`,
      error: error ?? responseBody ?? undefined,
    });
  }
}
