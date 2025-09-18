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
import { and, count, eq, isNull } from "drizzle-orm";
import type { Response } from "express";
import { drizzle } from "~/database/drizzle";
import {
  monitoringRulesTable,
  projectsTable,
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
import { PagedResponse } from "../models/response-models/paged.response";
import { GetProjectResponse } from "../models/response-models/projects/get-project.response";
import { GetProjectsResponse } from "../models/response-models/projects/get-projects.response";
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
    @Body() body: CreateProjectRequest,
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

      if (body.monitoringRules) {
        await tx
          .update(monitoringRulesTable)
          .set({
            checkIntervalSeconds: body.monitoringRules.checkIntervalSeconds,
            timeoutThresholdSeconds:
              body.monitoringRules.timeoutThresholdSeconds,
            isActive: body.monitoringRules.isActive,
          })
          .where(eq(monitoringRulesTable.projectId, id))
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
    response: Response<ApiResultResponse<PagedResponse<GetProjectsResponse>>>,
  ): Promise<Response<ApiResultResponse<PagedResponse<GetProjectsResponse>>>> {
    const userId = user.id;
    const offset = getPaginationOffset(query);

    const [data, [{ totalCount }]] = await Promise.all([
      drizzle.query.projectsTable.findMany({
        columns: {
          name: true,
          createdAt: true,
          upTimeStatus: true,
        },
        where: and(
          isNull(projectsTable.deletedAt),
          eq(projectsTable.userId, userId),
        ),
        limit: query.limit,
        offset: offset,
      }),
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
    ]);

    const pagination = getPaginationResponse(totalCount, query);

    return response.status(200).json({
      success: true,
      content: {
        data,
        pagination,
      },
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
        checkIntervalSeconds: true,
        timeoutThresholdSeconds: true,
        isActive: true,
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
