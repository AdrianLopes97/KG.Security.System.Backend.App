import { Body, Controller, Post, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { drizzle } from "~/database/drizzle";
import { scanProcessQueuesTable } from "~/database/drizzle/entities";
import { ApiResultResponse } from "~/types/api-result-response";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { AuthGuardStrategy } from "~/types/enums/auth-guard-strategy.enums";
import { ScanStatus } from "~/types/enums/scan-status.enums";
import { CreateScanProcessQueueRequest } from "../models/request-models/scan-process-queue/create-scan-process-queue.request";

@ApiTags(ApiTag.ScanProcessQueue)
@Controller("api/scan-process-queue")
@ApiBearerAuth()
export class ScanProcessQueueController {
  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Post()
  async createProject(
    @Body() body: CreateScanProcessQueueRequest,
    @Res() response: Response<ApiResultResponse<null>>,
  ): Promise<Response<ApiResultResponse<null>>> {
    await drizzle.transaction(async tx => {
      await tx
        .insert(scanProcessQueuesTable)
        .values({
          projectId: body.projectId,
          scanType: body.scanType,
          status: ScanStatus.PENDING,
          requestedAt: new Date(),
        })
        .execute();
    });

    return response.status(200).json({
      success: true,
      message: "Processo de varredura adicionado à fila com sucesso.",
    });
  }
}
