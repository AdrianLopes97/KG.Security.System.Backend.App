import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import type { Response } from "express";
import { drizzle } from "~/database/drizzle";
import {
  scanProcessQueuesTable,
  vulnerabilitiesTable,
} from "~/database/drizzle/entities";
import { ApiResultResponse } from "~/types/api-result-response";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { AuthGuardStrategy } from "~/types/enums/auth-guard-strategy.enums";
import { ScanStatus } from "~/types/enums/scan-status.enums";
import { PaginationQuery } from "~/types/pagination-query.request";
import { getPaginationOffset } from "~/utils/get-pagination-offset";
import { getPaginationResponse } from "~/utils/get-pagination-response";
import { GetVulnerabilitiesMainTableResponse } from "../models/response-models/vulnerabilities/get-vulnerabilities-main-table.response";

@ApiTags(ApiTag.Vulnerability)
@Controller("api/vulnerabilities")
@ApiBearerAuth()
export class VulnerabilitiesController {
  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get()
  async getVulnerabilities(
    @Query("projectId") projectId: string,
    @Query() query: PaginationQuery,
    @Res()
    response: Response<ApiResultResponse<GetVulnerabilitiesMainTableResponse>>,
  ): Promise<Response<ApiResultResponse<GetVulnerabilitiesMainTableResponse>>> {
    if (!projectId) {
      return response.status(400).json({
        success: false,
        message: "O ID do projeto é obrigatório.",
      });
    }

    const offset = getPaginationOffset(query);

    const identity = sql<string>`
      coalesce(
        ${vulnerabilitiesTable.fingerprint},
        ${vulnerabilitiesTable.ruleId} || '|' || ${vulnerabilitiesTable.filePath} || '|' || ${vulnerabilitiesTable.lineNumber}::text
      )
    `;

    const [
      data,
      [{ totalCount }],
      [{ pendingScans }],
      [{ successfulScans }],
      [{ failedScans }],
    ] = await Promise.all([
      (async () => {
        const base = drizzle
          .select({
            id: vulnerabilitiesTable.id,
            createdAt: vulnerabilitiesTable.createdAt,
            severity: vulnerabilitiesTable.severity,
            ruleId: vulnerabilitiesTable.ruleId,
            description: vulnerabilitiesTable.description,
            foundInScans:
              sql<number>`count(*) over (partition by ${vulnerabilitiesTable.projectId}, ${identity})`.as(
                "foundInScans",
              ),
            isRecurrent:
              sql<boolean>`(count(*) over (partition by ${vulnerabilitiesTable.projectId}, ${identity})) > 1`.as(
                "isRecurrent",
              ),
            rowNumber:
              sql<number>`row_number() over (partition by ${vulnerabilitiesTable.projectId}, ${identity} order by ${vulnerabilitiesTable.createdAt} desc)`.as(
                "rowNumber",
              ),
          })
          .from(vulnerabilitiesTable)
          .where(
            and(
              isNull(vulnerabilitiesTable.deletedAt),
              eq(vulnerabilitiesTable.projectId, projectId),
            ),
          )
          .as("v");

        return drizzle
          .select({
            id: base.id,
            createdAt: base.createdAt,
            severity: base.severity,
            ruleId: base.ruleId,
            description: base.description,
            isRecurrent: base.isRecurrent,
            foundInScans: base.foundInScans,
          })
          .from(base)
          .where(eq(base.rowNumber, 1))
          .orderBy(desc(base.createdAt))
          .limit(query.limit)
          .offset(offset)
          .execute();
      })(),

      // totalCount
      (async () => {
        return drizzle
          .select({
            totalCount: sql<number>`count(distinct (${vulnerabilitiesTable.projectId} || '|' || ${identity}))`,
          })
          .from(vulnerabilitiesTable)
          .where(
            and(
              isNull(vulnerabilitiesTable.deletedAt),
              eq(vulnerabilitiesTable.projectId, projectId),
            ),
          )
          .execute();
      })(),
      drizzle
        .select({ pendingScans: count() })
        .from(scanProcessQueuesTable)
        .where(
          and(
            isNull(scanProcessQueuesTable.deletedAt),
            eq(scanProcessQueuesTable.projectId, projectId),
            eq(scanProcessQueuesTable.status, ScanStatus.PENDING),
          ),
        )
        .execute(),
      drizzle
        .select({ successfulScans: count() })
        .from(scanProcessQueuesTable)
        .where(
          and(
            isNull(scanProcessQueuesTable.deletedAt),
            eq(scanProcessQueuesTable.projectId, projectId),
            eq(scanProcessQueuesTable.status, ScanStatus.COMPLETED),
          ),
        )
        .execute(),
      drizzle
        .select({ failedScans: count() })
        .from(scanProcessQueuesTable)
        .where(
          and(
            isNull(scanProcessQueuesTable.deletedAt),
            eq(scanProcessQueuesTable.projectId, projectId),
            eq(scanProcessQueuesTable.status, ScanStatus.FAILED),
          ),
        )
        .execute(),
    ]);

    const pagination = getPaginationResponse(totalCount, query);

    return response.status(200).json({
      success: true,
      content: {
        pagination: pagination,
        vulnerabilities: data,
        totalCount: totalCount,
        pendingScans: pendingScans,
        successfulScans: successfulScans,
        failedScans: failedScans,
      },
    });
  }
}
