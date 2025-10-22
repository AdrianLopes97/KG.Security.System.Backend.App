import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { isUUID } from "class-validator";
import dayjs from "dayjs";
import { and, between, count, desc, eq, isNull, sql } from "drizzle-orm";
import type { Response } from "express";
import { drizzle } from "~/database/drizzle";
import {
  heartbeatsTable,
  monitoringRulesTable,
  projectLogsTable,
  projectsTable,
  vulnerabilitiesTable,
} from "~/database/drizzle/entities";
import { ApiResultResponse } from "~/types/api-result-response";
import { RequestWithUser } from "~/types/app-context";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { AuthGuardStrategy } from "~/types/enums/auth-guard-strategy.enums";
import { UpTimeStatus } from "~/types/enums/up-time-status.enum";
import { PaginationQuery } from "~/types/pagination-query.request";
import { getPaginationOffset } from "~/utils/get-pagination-offset";
import { getPaginationResponse } from "~/utils/get-pagination-response";
import { CreateProjectRequest } from "../models/request-models/project/create-project.request";
import { UpdateProjectRequest } from "../models/request-models/project/update-project.request";
import { GetProjectListResponse } from "../models/response-models/projects/get-project-list.response";
import { GetProjectResponse } from "../models/response-models/projects/get-project.response";
import { GetProjectsMainTableResponse } from "../models/response-models/projects/get-projects-main-table.response";
@ApiTags(ApiTag.Project)
@Controller("api/project")
@ApiBearerAuth()
export class ProjectController {
  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Post()
  async createProject(
    @Body() body: CreateProjectRequest,
    @Res() response: Response<ApiResultResponse<null>>,
    @Req() { user }: RequestWithUser,
  ): Promise<Response<ApiResultResponse<null>>> {
    const userId = user.id;

    await drizzle.transaction(async tx => {
      const [project] = await tx
        .insert(projectsTable)
        .values({
          name: body.name,
          githubUrl: body.githubUrl || null,
          systemUrl: body.systemUrl || null,
          userId: userId,
          upTimeStatus: UpTimeStatus.UNKNOWN,
          webhookKey: crypto.randomUUID(),
        })
        .returning({ id: projectsTable.id });

      if (body.monitoringRules) {
        await tx.insert(monitoringRulesTable).values({
          projectId: project.id,
          checkIntervalSeconds: body.monitoringRules.checkIntervalSeconds,
          timeoutThresholdSeconds: body.monitoringRules.timeoutThresholdSeconds,
          isActive: body.monitoringRules.isActive,
        });
      }
    });

    return response.status(200).json({
      success: true,
    });
  }

  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Put(":id")
  async updateProject(
    @Param("id") id: string,
    @Body() body: UpdateProjectRequest,
    @Res() response: Response<ApiResultResponse<null>>,
  ): Promise<Response<ApiResultResponse<null>>> {
    if (!isUUID(id)) {
      return response.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const project = await drizzle.query.projectsTable.findFirst({
      where: eq(projectsTable.id, id),
    });

    if (!project) {
      return response.status(400).json({
        success: false,
        message: "Projeto não encontrado",
      });
    }

    await drizzle.transaction(async tx => {
      await tx
        .update(projectsTable)
        .set({
          name: body.name,
          githubUrl: body.githubUrl || null,
          systemUrl: body.systemUrl || null,
        })
        .where(eq(projectsTable.id, id))
        .execute();

      if (body.monitoringRules?.id) {
        await tx
          .update(monitoringRulesTable)
          .set({
            checkIntervalSeconds: body.monitoringRules.checkIntervalSeconds,
            timeoutThresholdSeconds:
              body.monitoringRules.timeoutThresholdSeconds,
            slackWebhookUrl: body.monitoringRules.slackWebhookUrl || null,
            isActive: body.monitoringRules.isActive,
          })
          .where(eq(monitoringRulesTable.id, body.monitoringRules.id))
          .execute();
      } else if (body.monitoringRules && !body.monitoringRules?.id) {
        await tx
          .insert(monitoringRulesTable)
          .values({
            projectId: id,
            checkIntervalSeconds: body.monitoringRules.checkIntervalSeconds,
            timeoutThresholdSeconds:
              body.monitoringRules.timeoutThresholdSeconds,
            slackWebhookUrl: body.monitoringRules.slackWebhookUrl || null,
            isActive: body.monitoringRules.isActive,
          })
          .execute();
      } else {
        await tx
          .update(monitoringRulesTable)
          .set({
            isActive: false,
            deletedAt: new Date(),
          })
          .where(eq(monitoringRulesTable.projectId, id))
          .execute();
      }
    });

    return response.status(200).json({
      success: true,
    });
  }

  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get()
  async getProjects(
    @Query() query: PaginationQuery,
    @Req() { user }: RequestWithUser,
    @Res()
    response: Response<ApiResultResponse<GetProjectsMainTableResponse>>,
  ): Promise<Response<ApiResultResponse<GetProjectsMainTableResponse>>> {
    const userId = user.id;
    const offset = getPaginationOffset(query);

    const today = dayjs(new Date());

    const [
      data,
      [{ totalCount }],
      [{ totalProjectsOnlineCount }],
      [{ vulnerabilityTotalCount }],
      [{ logsTotalCount }],
    ] = await Promise.all([
      drizzle
        .select({
          id: projectsTable.id,
          name: projectsTable.name,
          systemUrl: projectsTable.systemUrl,
          upTimeStatus: projectsTable.upTimeStatus,
          createdAt: projectsTable.createdAt,
          uptimePercentage: sql<number>`
            COALESCE((
              SELECT CASE
                WHEN w.window_seconds > 0 THEN ROUND(
                  GREATEST(w.window_seconds - w.total_down_seconds, 0) / w.window_seconds * 100,
                2)
                ELSE 0
              END
              FROM (
                SELECT
                  -- Janela: do primeiro heartbeat até agora (0 se não existir heartbeat)
                  EXTRACT(EPOCH FROM (NOW() - COALESCE((
                    SELECT MIN(hb.received_at)
                    FROM heartbeats hb
                    WHERE hb.project_id = ${projectsTable.id}
                      AND hb.deleted_at IS NULL
                  ), NOW()))) AS window_seconds,
                  (
                    -- Downtime fechado
                    COALESCE((
                      SELECT SUM(COALESCE(mi.duration_seconds, EXTRACT(EPOCH FROM (mi.ended_at - mi.started_at))))
                      FROM monitoring_incidents mi
                      WHERE mi.project_id = ${projectsTable.id}
                        AND mi.is_open = false
                        AND mi.deleted_at IS NULL
                    ), 0)
                    +
                    -- Downtime aberto até agora (clamp pelo primeiro heartbeat)
                    COALESCE((
                      SELECT EXTRACT(EPOCH FROM (NOW() - GREATEST(
                        mi2.started_at,
                        COALESCE((
                          SELECT MIN(hb2.received_at)
                          FROM heartbeats hb2
                          WHERE hb2.project_id = ${projectsTable.id}
                            AND hb2.deleted_at IS NULL
                        ), NOW())
                      )))
                      FROM monitoring_incidents mi2
                      WHERE mi2.project_id = ${projectsTable.id}
                        AND mi2.is_open = true
                        AND mi2.deleted_at IS NULL
                      LIMIT 1
                    ), 0)
                  ) AS total_down_seconds
              ) w
            ), 0)
          `,
          totalVulnerabilities: sql<number>`
          COUNT(DISTINCT CASE 
            WHEN ${vulnerabilitiesTable.id} IS NOT NULL 
             AND ${vulnerabilitiesTable.deletedAt} IS NULL 
            THEN ${vulnerabilitiesTable.id} 
          END)
        `,
          logsCount: sql<number>`
          COUNT(DISTINCT CASE 
            WHEN ${projectLogsTable.id} IS NOT NULL 
             AND ${projectLogsTable.deletedAt} IS NULL 
            THEN ${projectLogsTable.id} 
          END)
        `,
          lastScanAt: sql<Date | null>`MAX(${vulnerabilitiesTable.createdAt})`,
        })
        .from(projectsTable)
        .leftJoin(
          projectLogsTable,
          eq(projectLogsTable.projectId, projectsTable.id),
        )
        .leftJoin(
          vulnerabilitiesTable,
          eq(vulnerabilitiesTable.projectId, projectsTable.id),
        )
        .leftJoin(
          heartbeatsTable,
          eq(heartbeatsTable.projectId, projectsTable.id),
        )
        .where(
          and(
            isNull(projectsTable.deletedAt),
            eq(projectsTable.userId, userId),
          ),
        )
        .groupBy(projectsTable.id)
        .orderBy(desc(projectsTable.createdAt))
        .limit(query.limit)
        .offset(offset)
        .execute(),
      drizzle
        .select({ totalCount: count() })
        .from(projectsTable)
        .where(
          and(
            isNull(projectsTable.deletedAt),
            eq(projectsTable.userId, userId),
          ),
        )
        .execute(),
      drizzle
        .select({ totalProjectsOnlineCount: count() })
        .from(projectsTable)
        .where(
          and(
            isNull(projectsTable.deletedAt),
            eq(projectsTable.userId, userId),
            eq(projectsTable.upTimeStatus, UpTimeStatus.UP),
          ),
        )
        .execute(),
      drizzle
        .select({ vulnerabilityTotalCount: count() })
        .from(projectsTable)
        .innerJoin(
          vulnerabilitiesTable,
          eq(vulnerabilitiesTable.projectId, projectsTable.id),
        )
        .where(
          and(
            isNull(projectsTable.deletedAt),
            eq(projectsTable.userId, userId),
            isNull(vulnerabilitiesTable.deletedAt),
          ),
        )
        .execute(),
      drizzle
        .select({ logsTotalCount: count() })
        .from(projectsTable)
        .innerJoin(
          projectLogsTable,
          eq(projectLogsTable.projectId, projectsTable.id),
        )
        .where(
          and(
            isNull(projectsTable.deletedAt),
            eq(projectsTable.userId, userId),
            isNull(projectLogsTable.deletedAt),
            between(
              projectLogsTable.createdAt,
              today.subtract(24, "hour").toDate(),
              today.toDate(),
            ),
          ),
        )
        .execute(),
    ]);

    const pagination = getPaginationResponse(totalCount, query);

    return response.status(200).json({
      success: true,
      content: {
        pagination: pagination,
        projects: data,
        vulnerabilityTotalCount: vulnerabilityTotalCount,
        logsTotalCount: logsTotalCount,
        totalCount: totalCount,
        totalProjectsOnlineCount: totalProjectsOnlineCount,
      },
    });
  }

  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get("list")
  async getProjectsList(
    @Req() { user }: RequestWithUser,
    @Res()
    response: Response<ApiResultResponse<GetProjectListResponse[]>>,
  ): Promise<Response<ApiResultResponse<GetProjectListResponse[]>>> {
    const userId = user.id;
    const data = await drizzle
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
      })
      .from(projectsTable)
      .where(
        and(isNull(projectsTable.deletedAt), eq(projectsTable.userId, userId)),
      )
      .execute();

    return response.status(200).json({
      success: true,
      content: data,
    });
  }

  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get(":id")
  async getProjectById(
    @Param("id") id: string,
    @Res()
    response: Response<ApiResultResponse<GetProjectResponse>>,
  ): Promise<Response<ApiResultResponse<GetProjectResponse>>> {
    if (!isUUID(id)) {
      return response.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const project = await drizzle.query.projectsTable.findFirst({
      columns: {
        name: true,
        createdAt: true,
        githubUrl: true,
        systemUrl: true,
        upTimeStatus: true,
      },
      where: eq(projectsTable.id, id),
    });

    if (!project) {
      return response.status(400).json({
        success: false,
        message: "Projeto não encontrado",
      });
    }

    const monitoringRule = await drizzle.query.monitoringRulesTable.findFirst({
      columns: {
        id: true,
        checkIntervalSeconds: true,
        timeoutThresholdSeconds: true,
        isActive: true,
        slackWebhookUrl: true,
      },
      where: eq(monitoringRulesTable.projectId, id),
    });

    return response.status(200).json({
      success: true,
      content: {
        ...project,
        monitoringRules: monitoringRule || null,
      },
    });
  }

  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get("key/:id")
  async getProjectKeyById(
    @Param("id") id: string,
    @Res()
    response: Response<ApiResultResponse<string>>,
  ): Promise<Response<ApiResultResponse<string>>> {
    if (!isUUID(id)) {
      return response.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const project = await drizzle.query.projectsTable.findFirst({
      columns: {
        webhookKey: true,
      },
      where: eq(projectsTable.id, id),
    });

    if (!project) {
      return response.status(400).json({
        success: false,
        message: "Projeto não encontrado",
      });
    }

    return response.status(200).json({
      success: true,
      content: project.webhookKey,
    });
  }

  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Delete(":id")
  async softDeleteProject(
    @Param("id") id: string,
    @Res() response: Response<ApiResultResponse<null>>,
  ): Promise<Response<ApiResultResponse<null>>> {
    if (!isUUID(id)) {
      return response.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const project = await drizzle.query.projectsTable.findFirst({
      where: eq(projectsTable.id, id),
    });

    if (!project) {
      return response.status(404).json({
        success: false,
        message: "Projeto não encontrado",
      });
    }

    await drizzle.transaction(async tx => {
      await tx
        .update(projectsTable)
        .set({ deletedAt: new Date() })
        .where(eq(projectsTable.id, id))
        .execute();

      await tx
        .update(monitoringRulesTable)
        .set({
          isActive: false,
          deletedAt: new Date(),
        })
        .where(eq(monitoringRulesTable.projectId, id))
        .execute();
    });

    return response.status(200).json({
      success: true,
      message: "Projeto deletado com sucesso",
    });
  }
}
