import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { count, eq, isNull } from "drizzle-orm";
import { Response } from "express";
import { drizzle } from "~/database/drizzle";
import { usersTable } from "~/database/drizzle/entities";
import { ApiResultResponse } from "~/types/api-result-response";
import { ApiTag } from "~/types/enums/api-tag.enum";
import { AuthGuardStrategy } from "~/types/enums/auth-guard-strategy.enums";
import { getPaginationOffset } from "~/utils/get-pagination-offset";
import { getPaginationResponse } from "~/utils/get-pagination-response";
import { hash } from "~/utils/hash";
import { PaginationQuery } from "../../../types/pagination-query.request";
import { CreateUser } from "../models/request-models/users/create-user.request";
import { PagedResponse } from "../models/response-models/paged.response";
import { GetUserResponse } from "../models/response-models/users/get-user.response";

@ApiTags(ApiTag.Users)
@Controller("api/users")
@ApiBearerAuth()
export class UsersController {
  @UseGuards(AuthGuard(AuthGuardStrategy.JWT))
  @Get()
  async getUsers(
    @Query() query: PaginationQuery,
    @Res()
    response: Response<ApiResultResponse<PagedResponse<GetUserResponse>>>,
  ): Promise<Response<ApiResultResponse<PagedResponse<GetUserResponse>>>> {
    const offset = getPaginationOffset(query);

    const [data, [{ totalCount }]] = await Promise.all([
      drizzle.query.usersTable.findMany({
        columns: {
          id: true,
          createdAt: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        },
        where: isNull(usersTable.deletedAt),
        limit: query.limit,
        offset: offset,
      }),
      drizzle
        .select({ totalCount: count() })
        .from(usersTable)
        .where(isNull(usersTable.deletedAt))
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
  async getUserById(
    @Param("id") id: string,
    @Res() response: Response<ApiResultResponse<GetUserResponse>>,
  ): Promise<Response<ApiResultResponse<GetUserResponse>>> {
    const user = await drizzle.query.usersTable.findFirst({
      columns: {
        id: true,
        createdAt: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },
      where: eq(usersTable.id, id),
    });

    if (!user) {
      return response.status(400).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    return response.status(200).json({
      success: true,
      content: user,
    });
  }

  @Post("register")
  async register(
    @Body() body: CreateUser,
    @Res() response: Response<ApiResultResponse<null>>,
  ): Promise<Response<ApiResultResponse<null>>> {
    const existingUser = await drizzle.query.usersTable.findFirst({
      where: eq(usersTable.email, body.email),
    });

    if (existingUser) {
      return response.status(400).json({
        success: false,
        message: "Não foi possivel criar o usuário!",
      });
    }

    const newUserId = await drizzle
      .insert(usersTable)
      .values({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phoneNumber: body.phoneNumber,
        password: await hash(body.password),
      })
      .returning({ id: usersTable.id })
      .execute();

    if (!newUserId) {
      return response.status(400).json({
        success: false,
        message: "Não foi possível criar o usuário!",
      });
    }

    return response.status(200).json({
      success: true,
      message: "Usuário registrado com sucesso!",
    });
  }
}
