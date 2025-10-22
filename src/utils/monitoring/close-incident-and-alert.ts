import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { drizzle } from "~/database/drizzle";
import {
  monitoringAlertsTable,
  monitoringIncidentsTable,
} from "~/database/drizzle/entities";
import type { Heartbeat } from "~/database/drizzle/entities/heartbeats";
import type { MonitoringIncident } from "~/database/drizzle/entities/monitoring-incidents";
import type { MonitoringRule } from "~/database/drizzle/entities/monitoring-rules";
import "~/dayjs";
import { AlertChannel } from "~/types/enums/alert-channel.enums";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";
import type { SlackMessage } from "~/types/monitoring.types";
import { sendSlackMessage } from "../send-slack-message";
import { updateProjectStatus } from "./update-project-status";

export async function closeIncidentAndAlert(
  rule: MonitoringRule,
  projectId: string,
  openIncident: MonitoringIncident,
  latestHeartbeat: Heartbeat,
  now: Date,
): Promise<void> {
  const endedAt = now;
  const durationSeconds = dayjs(endedAt).diff(
    dayjs(openIncident.startedAt),
    "second",
  );

  await drizzle
    .update(monitoringIncidentsTable)
    .set({
      isOpen: false,
      endedAt,
      durationSeconds,
      lastHeartbeatAt: latestHeartbeat.receivedAt,
    })
    .where(eq(monitoringIncidentsTable.id, openIncident.id))
    .execute();

  await updateProjectStatus(projectId, UpTimeStatus.UP);

  if (rule.slackWebhookUrl) {
    const payload: SlackMessage = {
      text: `:white_check_mark: Projeto ${projectId} voltou UP. Duração da indisponibilidade: ${durationSeconds}s.`,
    };
    const { delivered, statusCode, responseBody, error } =
      await sendSlackMessage(rule.slackWebhookUrl, payload);

    await drizzle.insert(monitoringAlertsTable).values({
      projectId,
      incidentId: openIncident.id,
      channel: AlertChannel.SLACK,
      destination: rule.slackWebhookUrl,
      sentAt: new Date(),
      payload: JSON.stringify(payload),
      status: delivered ? `SENT(${statusCode})` : `FAILED(${statusCode})`,
      error: error ?? responseBody ?? undefined,
    });
  }
}
