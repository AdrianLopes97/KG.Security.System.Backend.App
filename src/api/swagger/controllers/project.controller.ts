import { Body, Controller, Post, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { ApiResultResponse } from "~/types/api-result-response";
import { ApiTag } from "~/types/enums/api-tag.enum";

@ApiTags(ApiTag.Project)
@Controller("api/project")
@ApiBearerAuth()
export class ProjectController {
  @Post()
  async createProject(
    @Body() body: any,
    @Res() response: Response<ApiResultResponse<null>>,
  ): Promise<Response<ApiResultResponse<null>>> {

    

    return response.status(201).json({
      success: true,
    });
  }
}
