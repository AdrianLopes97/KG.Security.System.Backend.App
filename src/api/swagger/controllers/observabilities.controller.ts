import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { and, between, count, desc, eq, isNull } from "drizzle-orm";
import type { Response } from "express";
import { drizzle } from "~/database/drizzle";
import { projectLogsTable } from "~/database/drizzle/entities";
import { ApiResultResponse } from "~/types/api-result-response";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { AuthGuardStrategy } from "~/types/enums/auth-guard-strategy.enums";
import { FilterPeriods } from "~/types/enums/filter-periods.enum";
import { PaginationQuery } from "~/types/pagination-query.request";
import { getPaginationOffset } from "~/utils/get-pagination-offset";
import { getPaginationResponse } from "~/utils/get-pagination-response";
import { getPeriodByFilterEnum } from "~/utils/get-period-by-filter-enum";
import { GetObservabilitiesMainTableResponse } from "../models/response-models/observabilities/get-observabilities-main-table.response";

@ApiTags(ApiTag.Observability)
@Controller("api/observabilities")
@ApiBearerAuth()
export class ObservabilitiesController {
  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get()
  async getObservabilities(
    @Query("projectId") projectId: string,
    @Query("filterPeriod") filterPeriod: FilterPeriods,
    @Query() query: PaginationQuery,
    @Res()
    response: Response<ApiResultResponse<GetObservabilitiesMainTableResponse>>,
  ): Promise<Response<ApiResultResponse<GetObservabilitiesMainTableResponse>>> {
    if (!projectId) {
      return response.status(400).json({
        success: false,
        message: "O ID do projeto é obrigatório.",
      });
    }

    if (!filterPeriod) {
      return response.status(400).json({
        success: false,
        message: "O período de filtro é obrigatório.",
      });
    }
    const offset = getPaginationOffset(query);
    const [beginDate, endDate] = getPeriodByFilterEnum(filterPeriod);

    let whereClause = and(
      isNull(projectLogsTable.deletedAt),
      eq(projectLogsTable.projectId, projectId),
    );

    if (beginDate && endDate) {
      whereClause = and(
        whereClause,
        between(projectLogsTable.createdAt, beginDate, endDate),
      );
    }

    const [
      data,
      [{ totalCount }],
      [{ errorLogs }],
      [{ alertLogs }],
      [{ infoLogs }],
    ] = await Promise.all([
      drizzle
        .select({
          id: projectLogsTable.id,
          name: projectLogsTable.name,
          description: projectLogsTable.message,
          createdAt: projectLogsTable.createdAt,
          level: projectLogsTable.level,
        })
        .from(projectLogsTable)
        .where(whereClause)
        .orderBy(desc(projectLogsTable.createdAt))
        .limit(query.limit)
        .offset(offset)
        .execute(),
      drizzle
        .select({ totalCount: count() })
        .from(projectLogsTable)
        .where(whereClause)
        .execute(),
      drizzle
        .select({ errorLogs: count() })
        .from(projectLogsTable)
        .where(whereClause)
        .execute(),
      drizzle
        .select({ alertLogs: count() })
        .from(projectLogsTable)
        .where(whereClause)
        .execute(),
      drizzle
        .select({ infoLogs: count() })
        .from(projectLogsTable)
        .where(whereClause)
        .execute(),
    ]);

    const pagination = getPaginationResponse(totalCount, query);

    return response.status(200).json({
      success: true,
      content: {
        pagination: pagination,
        observabilities: data,
        totalCount: totalCount,
        errorLogs: errorLogs,
        alertLogs: alertLogs,
        infoLogs: infoLogs,
      },
    });
  }
}
