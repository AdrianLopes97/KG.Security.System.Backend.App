import { Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiTag } from "~/types/enums/api-tag.enum";
@ApiTags(ApiTag.ScanProcessQueue)
@Controller("api/scan-process-queue")
@ApiBearerAuth()
export class ScanProcessQueueController {
  
  // Implement controller methods here
  





}
