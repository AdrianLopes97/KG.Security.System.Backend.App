import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { ApiResultResponse } from "~/types/api-result-response";
import { RequestWithUser } from "~/types/app-context";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { AuthGuardStrategy } from "~/types/enums/auth-guard-strategy.enums";
import { CreateProjectRequest } from "../models/request-models/project/create-project.request";

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
    console.log(userId);
    console.log(body);

    return response.status(201).json({
      success: true,
    });
  }
}
