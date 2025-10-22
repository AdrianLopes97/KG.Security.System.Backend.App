import { Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import { and, desc, eq } from "drizzle-orm";
import http from "node:http";
import https from "node:https";
import { drizzle } from "~/database/drizzle";
import {
  heartbeatsTable,
  monitoringAlertsTable,
  monitoringIncidentsTable,
  monitoringRulesTable,
  projectsTable,
} from "~/database/drizzle/entities";
import "~/dayjs";
import { env } from "~/env";
import { AlertChannel } from "~/types/enums/alert-channel.enums";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";
import { CronTask } from "./cron-task";

@Injectable()
export class MonitoringCronService extends CronTask {
  interval = env.CRON_MONITORING_INTERVAL;
  disabled = env.CRON_MONITORING_DISABLED;

  async execute() {
    const now = new Date();
    try {
      console.log(`[${now.toISOString()}] Executing Monitoring cron task...`);

      // 1) Obter todas as regras ativas
      const activeRules = await drizzle
        .select()
        .from(monitoringRulesTable)
        .where(eq(monitoringRulesTable.isActive, true));

      if (!activeRules.length) {
        console.log("[MONITORING] Nenhuma regra ativa encontrada.");
        return;
      }

      for (const rule of activeRules) {
        const projectId = rule.projectId;

        // 2) Buscar último heartbeat do projeto
        const latestHeartbeat = await drizzle.query.heartbeatsTable.findFirst({
          where: eq(heartbeatsTable.projectId, projectId),
          orderBy: desc(heartbeatsTable.receivedAt),
        });

        if (!latestHeartbeat) {
          // Sem heartbeats: manter como UNKNOWN e seguir para próximo
          await drizzle
            .update(projectsTable)
            .set({ upTimeStatus: UpTimeStatus.UNKNOWN })
            .where(eq(projectsTable.id, projectId))
            .execute();
          continue;
        }

        const secondsSinceLast = dayjs(now).diff(
          dayjs(latestHeartbeat.receivedAt),
          "second",
        );

        const isTimeout =
          secondsSinceLast > (rule.timeoutThresholdSeconds ?? 0);
        const isErrorStatus = latestHeartbeat.status === "ERROR";
        const isDown = isTimeout || isErrorStatus;

        // 3) Verificar se há incidente aberto
        const openIncident =
          await drizzle.query.monitoringIncidentsTable.findFirst({
            where: and(
              eq(monitoringIncidentsTable.projectId, projectId),
              eq(monitoringIncidentsTable.isOpen, true),
            ),
            orderBy: desc(monitoringIncidentsTable.startedAt),
          });

        if (isDown) {
          // DOWN: abrir incidente se ainda não houver, marcar projeto como DOWN e enviar alerta ao abrir
          if (!openIncident) {
            const reason = isTimeout ? "TIMEOUT_EXCEEDED" : "HEARTBEAT_ERROR";

            const [inserted] = await drizzle
              .insert(monitoringIncidentsTable)
              .values({
                projectId,
                startedAt: latestHeartbeat.receivedAt ?? now,
                isOpen: true,
                lastHeartbeatAt: latestHeartbeat.receivedAt,
                reason,
              })
              .returning({ id: monitoringIncidentsTable.id });

            await drizzle
              .update(projectsTable)
              .set({ upTimeStatus: UpTimeStatus.DOWN })
              .where(eq(projectsTable.id, projectId))
              .execute();

            // Enviar alerta de abertura se webhook Slack estiver configurado
            if (rule.slackWebhookUrl) {
              const payload = {
                text: `:rotating_light: Projeto ${projectId} DOWN. Motivo: ${reason}. Último heartbeat há ${secondsSinceLast}s.`,
              };
              const { delivered, statusCode, responseBody, error } =
                await this.postJson(rule.slackWebhookUrl, payload);

              await drizzle.insert(monitoringAlertsTable).values({
                projectId,
                incidentId: inserted.id,
                channel: AlertChannel.SLACK,
                destination: rule.slackWebhookUrl,
                sentAt: new Date(),
                payload: JSON.stringify(payload),
                status: delivered
                  ? `SENT(${statusCode})`
                  : `FAILED(${statusCode})`,
                error: error ?? responseBody ?? undefined,
              });
            }
          } else {
            // Incidente já aberto: manter status DOWN e atualizar último heartbeat observado
            await drizzle
              .update(projectsTable)
              .set({ upTimeStatus: UpTimeStatus.DOWN })
              .where(eq(projectsTable.id, projectId))
              .execute();

            await drizzle
              .update(monitoringIncidentsTable)
              .set({ lastHeartbeatAt: latestHeartbeat.receivedAt })
              .where(eq(monitoringIncidentsTable.id, openIncident.id))
              .execute();
          }
        } else {
          // UP: fechar incidente se houver aberto, marcar projeto como UP
          if (openIncident) {
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

            await drizzle
              .update(projectsTable)
              .set({ upTimeStatus: UpTimeStatus.UP })
              .where(eq(projectsTable.id, projectId))
              .execute();

            // Enviar alerta de recuperação (resolve) se webhook Slack estiver configurado
            if (rule.slackWebhookUrl) {
              const payload = {
                text: `:white_check_mark: Projeto ${projectId} voltou UP. Duração da indisponibilidade: ${durationSeconds}s.`,
              };
              const { delivered, statusCode, responseBody, error } =
                await this.postJson(rule.slackWebhookUrl, payload);

              await drizzle.insert(monitoringAlertsTable).values({
                projectId,
                incidentId: openIncident.id,
                channel: AlertChannel.SLACK,
                destination: rule.slackWebhookUrl,
                sentAt: new Date(),
                payload: JSON.stringify(payload),
                status: delivered
                  ? `SENT(${statusCode})`
                  : `FAILED(${statusCode})`,
                error: error ?? responseBody ?? undefined,
              });
            }
          } else {
            // Sem incidente aberto: garantir status UP
            await drizzle
              .update(projectsTable)
              .set({ upTimeStatus: UpTimeStatus.UP })
              .where(eq(projectsTable.id, projectId))
              .execute();
          }
        }
      }
    } catch (error) {
      console.error(
        `[${now.toISOString()}] Error executing Monitoring cron task:`,
        error,
      );
      await this.logError(error, {});
    }
  }

  private async postJson(
    url: string,
    body: unknown,
  ): Promise<{
    delivered: boolean;
    statusCode: number;
    responseBody?: string;
    error?: string;
  }> {
    return new Promise(resolve => {
      try {
        const payload = JSON.stringify(body);
        const isHttps = url.startsWith("https:");
        const client = isHttps ? https : http;
        const req = client.request(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload).toString(),
            },
          },
          res => {
            let data = "";
            res.on("data", chunk => (data += chunk));
            res.on("end", () => {
              const code = res.statusCode ?? 0;
              const ok = code >= 200 && code < 300;
              resolve({ delivered: ok, statusCode: code, responseBody: data });
            });
          },
        );
        req.on("error", err => {
          resolve({
            delivered: false,
            statusCode: 0,
            error: err.message,
          });
        });
        req.write(payload);
        req.end();
      } catch (e) {
        resolve({ delivered: false, statusCode: 0, error: String(e) });
      }
    });
  }
}
