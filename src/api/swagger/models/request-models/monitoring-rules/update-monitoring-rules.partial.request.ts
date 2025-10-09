import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, Min } from "class-validator";

export class UpdateMonitoringRulesPartialRequest {
  @ApiProperty({
    description: "ID da regra de monitoramento",
    example: "rule-123",
    required: false,
  })
  id?: string | null;

  @ApiProperty({
    description:
      "Intervalo de checagem em segundos para a regra de monitoramento",
    example: 60,
    required: true,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  checkIntervalSeconds: number;

  @ApiProperty({
    description:
      "Tempo limite (timeout) em segundos para a regra de monitoramento",
    example: 10,
    required: true,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  timeoutThresholdSeconds: number;

  @ApiProperty({
    description: "Se a regra de monitoramento estará ativa ao criar o projeto",
    example: true,
    required: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: "URL do webhook do Slack para notificações",
    example: "https://hooks.slack.com/services/XXX/YYY/ZZZ",
    required: false,
    nullable: true,
  })
  slackWebhookUrl?: string | null;
}
