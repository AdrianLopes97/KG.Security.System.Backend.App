import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import dayjs from "dayjs";
import { and, count, eq, gte, min, sql } from "drizzle-orm";
import type { Response } from "express";
import { drizzle } from "~/database/drizzle";
import {
  heartbeatsTable,
  monitoringAlertsTable,
  monitoringIncidentsTable,
  monitoringRulesTable,
  projectsTable,
} from "~/database/drizzle/entities";
import "~/dayjs";
import { ApiResultResponse } from "~/types/api-result-response";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { AuthGuardStrategy } from "~/types/enums/auth-guard-strategy.enums";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";
import { formatDuration } from "~/utils/format-duration";
import { GetMonitoringCountersResponse } from "../models/response-models/monitoring/get-monitoring-counters.response";

@ApiTags(ApiTag.Monitoring)
@Controller("api/monitoring")
@ApiBearerAuth()
export class MonitoringController {
  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get()
  async getMonitoring(
    @Query("projectId") projectId: string,
    @Res()
    response: Response<ApiResultResponse<GetMonitoringCountersResponse>>,
  ): Promise<Response<ApiResultResponse<GetMonitoringCountersResponse>>> {
    if (!projectId) {
      return response.status(400).json({
        success: false,
        message: "O ID do projeto é obrigatório.",
      });
    }

    const now = dayjs();
    const thirtyDaysAgo = now.subtract(30, "day").toDate();

    const [
      projectRow,
      firstHbRow,
      hbCountRow,
      closedDownRow,
      openIncidentRow,
      alerts30Row,
      activeRule,
    ] = await Promise.all([
      drizzle
        .select({ status: projectsTable.upTimeStatus })
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId))
        .limit(1),
      drizzle
        .select({ first: min(heartbeatsTable.receivedAt) })
        .from(heartbeatsTable)
        .where(eq(heartbeatsTable.projectId, projectId)),
      drizzle
        .select({ count: count() })
        .from(heartbeatsTable)
        .where(eq(heartbeatsTable.projectId, projectId)),
      drizzle
        .select({
          down: sql<number>`
              COALESCE(SUM(
                COALESCE(${monitoringIncidentsTable.durationSeconds},
                         EXTRACT(EPOCH FROM (${monitoringIncidentsTable.endedAt} - ${monitoringIncidentsTable.startedAt}))::int)
              ), 0)
            `,
        })
        .from(monitoringIncidentsTable)
        .where(
          and(
            eq(monitoringIncidentsTable.projectId, projectId),
            eq(monitoringIncidentsTable.isOpen, false),
          ),
        ),
      drizzle
        .select({ startedAt: monitoringIncidentsTable.startedAt })
        .from(monitoringIncidentsTable)
        .where(
          and(
            eq(monitoringIncidentsTable.projectId, projectId),
            eq(monitoringIncidentsTable.isOpen, true),
          ),
        )
        .limit(1),
      drizzle
        .select({ count: count() })
        .from(monitoringAlertsTable)
        .where(
          and(
            eq(monitoringAlertsTable.projectId, projectId),
            gte(monitoringAlertsTable.sentAt, thirtyDaysAgo),
          ),
        ),
      drizzle.query.monitoringRulesTable.findFirst({
        where: and(
          eq(monitoringRulesTable.projectId, projectId),
          eq(monitoringRulesTable.isActive, true),
        ),
      }),
    ]);

    if (!projectRow || projectRow.length === 0) {
      return response.status(400).json({
        success: false,
        message: "Projeto não encontrado.",
      });
    }

    const systemStatus = projectRow[0].status ?? UpTimeStatus.UNKNOWN;

    const firstHeartbeatAt = firstHbRow?.[0]?.first ?? null;
    const totalHeartbeats = Number(hbCountRow?.[0]?.count ?? 0);
    const closedDownSeconds = Number(closedDownRow?.[0]?.down ?? 0);
    const openStartedAt = openIncidentRow?.[0]?.startedAt ?? null;
    const alertsLast30Days = Number(alerts30Row?.[0]?.count ?? 0);

    let totalMonitoredMs = 0;
    if (firstHeartbeatAt) {
      totalMonitoredMs = now.diff(dayjs(firstHeartbeatAt));
    }
    const totalMonitoredSeconds = Math.max(
      0,
      Math.floor(totalMonitoredMs / 1000),
    );

    let openDownSeconds = 0;
    if (openStartedAt) {
      const started = dayjs(openStartedAt);
      const first = firstHeartbeatAt ? dayjs(firstHeartbeatAt) : null;
      const clampStart = first && started.isBefore(first) ? first : started;
      openDownSeconds = Math.max(0, now.diff(clampStart, "second"));
    }

    const totalDownSeconds = closedDownSeconds + openDownSeconds;
    const upSeconds = Math.max(0, totalMonitoredSeconds - totalDownSeconds);
    const uptimePercentage =
      totalMonitoredSeconds > 0 ? (upSeconds / totalMonitoredSeconds) * 100 : 0;

    const monitoringRules = activeRule
      ? {
          checkIntervalSeconds: activeRule.checkIntervalSeconds,
          timeoutThresholdSeconds: activeRule.timeoutThresholdSeconds,
          alertsConfigured: activeRule.slackWebhookUrl ? 1 : 0,
        }
      : null;

    return response.status(200).json({
      success: true,
      content: {
        systemStatus,
        totalHeartbeats,
        currentUptime: formatDuration(upSeconds * 1000),
        sentAlertsCount: alertsLast30Days,
        uptimePercentage: Number(uptimePercentage.toFixed(2)),
        downtimeInTime: formatDuration(totalDownSeconds * 1000),
        totalTimeMonitored: formatDuration(totalMonitoredMs),
        monitoringRules,
      },
    });
  }
}
