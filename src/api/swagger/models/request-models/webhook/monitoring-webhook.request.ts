import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { HeartbeatStatus } from "~/types/enums/heartbeats.enums";

export class MonitoringWebhookRequest {
  @ApiProperty({
    description: "Id do projeto",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
  @ApiProperty({
    description: "Chave do projeto",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  projectKey: string;
  @ApiProperty({
    description: "Status do heartbeat",
    example: HeartbeatStatus.OK,
    required: true,
  })
  @IsNotEmpty()
  heartBeatStatus: HeartbeatStatus;
}
