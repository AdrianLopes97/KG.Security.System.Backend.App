import { Body, Controller, Post, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import type { Response } from "express";
import { drizzle } from "~/database/drizzle";
import {
  heartbeatsTable,
  projectLogsTable,
  projectsTable,
} from "~/database/drizzle/entities";
import { ApiResultResponse } from "~/types/api-result-response";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { MonitoringWebhookRequest } from "../models/request-models/webhook/monitoring-webhook.request";
import { ObservabilityWebhookRequest } from "../models/request-models/webhook/observability-webhook.request";

@ApiTags(ApiTag.Webhooks)
@Controller("api/webhooks")
export class WebhooksController {
  @Post("observability")
  async observability(
    @Body() body: ObservabilityWebhookRequest,
    @Res() response: Response<ApiResultResponse<null>>,
  ): Promise<Response<ApiResultResponse<null>>> {
    const project = await drizzle.query.projectsTable.findFirst({
      where: and(
        eq(projectsTable.id, body.projectId),
        eq(projectsTable.webhookKey, body.projectKey),
      ),
    });

    if (!project) {
      return response.status(403).json({
        success: false,
        message: "Projeto não encontrado ou chave inválida.",
      });
    }

    await drizzle
      .insert(projectLogsTable)
      .values({
        projectId: body.projectId,
        level: body.level,
        message: body.Message,
        name: body.Name,
        origin: body.Origin,
        stack: body.Stack ?? null,
        stringified: body.Stringified ?? null,
        info: body.info ?? null,
      })
      .execute();

    return response.status(200).json({
      success: true,
    });
  }

  @Post("monitoring")
  async monitoring(
    @Body() body: MonitoringWebhookRequest,
    @Res() response: Response<ApiResultResponse<null>>,
  ): Promise<Response<ApiResultResponse<null>>> {
    const project = await drizzle.query.projectsTable.findFirst({
      where: and(
        eq(projectsTable.id, body.projectId),
        eq(projectsTable.webhookKey, body.projectKey),
      ),
    });

    if (!project) {
      return response.status(403).json({
        success: false,
        message: "Projeto não encontrado ou chave inválida.",
      });
    }

    const now = dayjs();

    await drizzle
      .insert(heartbeatsTable)
      .values({
        projectId: body.projectId,
        receivedAt: now.toDate(),
        status: body.heartBeatStatus,
      })
      .execute();

    return response.status(200).json({
      success: true,
    });
  }
}
