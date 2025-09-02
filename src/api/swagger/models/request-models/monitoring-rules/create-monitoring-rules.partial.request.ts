import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, Min } from "class-validator";

export class CreateMonitoringRulesPartialRequest {
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
}
