import { Body, Controller, Post, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { ApiTag } from "~/types/enums/api-tag.enum";

import { eq } from "drizzle-orm";
import { drizzle } from "~/database/drizzle";
import { usersTable } from "~/database/drizzle/entities";
import { ApiResultResponse } from "~/types/api-result-response";
import { compare } from "~/utils/hash";
import { createAccessToken } from "~/utils/jwt";
import { LoginRequest } from "../models/request-models/auth/login.request";
import { LoginResponse } from "../models/response-models/auth/login.response";

@ApiTags(ApiTag.Auth)
@Controller("api/auth")
export class AuthController {
  @Post("login")
  async login(
    @Body() body: LoginRequest,
    @Res()
    response: Response<ApiResultResponse<LoginResponse>>,
  ) {
    const user = await drizzle.query.usersTable.findFirst({
      where: eq(usersTable.email, body.email),
    });

    if (!user) {
      return response
        .status(401)
        .json({ success: false, message: "Usuário ou senha inválidos" });
    }

    const isPasswordValid = await compare(body.password, user.password);
    if (!isPasswordValid) {
      return response
        .status(401)
        .json({ success: false, message: "Usuário ou senha inválidos" });
    }

    const access_token = createAccessToken(user.id);
    const expires_in = 3600; // 1 hora

    return response
      .status(200)
      .json({ success: true, content: { access_token, expires_in } });
  }
}
