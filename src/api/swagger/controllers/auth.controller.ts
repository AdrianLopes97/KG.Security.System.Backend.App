import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiTag } from "~/types/enums/api-tag.enum";

@ApiTags(ApiTag.Auth)
@Controller("api/auth")
export class AuthController {
  @Get()
  getAuthHello(): string {
    return "Hello World!";
  }
}
