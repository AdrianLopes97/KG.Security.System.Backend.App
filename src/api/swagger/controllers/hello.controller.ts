import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiTag } from "~/types/enums/api-tag.enum";
@ApiTags(ApiTag.Hello)
@Controller("api/hello")
@ApiBearerAuth()
export class HelloController {
  @Get()
  getHello(): string {
    return "Hello World!";
  }
}
