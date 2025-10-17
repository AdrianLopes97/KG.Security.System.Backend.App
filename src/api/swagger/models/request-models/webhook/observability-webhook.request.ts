import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { ObservabilityLevels } from "~/types/enums/observabilities-levels.enums";

export class ObservabilityWebhookRequest {
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
    description: "Nível de observabilidade",
    example: ObservabilityLevels.INFO,
    required: true,
  })
  @IsNotEmpty()
  level: ObservabilityLevels;
  @ApiProperty({
    description: "Mensagem",
    example: "Esta é uma mensagem de exemplo",
    required: true,
  })
  @IsNotEmpty()
  Message: string;
  @ApiProperty({
    description: "Nome da observabilidade",
    example: "Observabilidade Exemplo",
    required: true,
  })
  @IsNotEmpty()
  Name: string;
  @ApiProperty({
    description: "Origem da observabilidade",
    example: "main.cpp",
    required: true,
  })
  @IsNotEmpty()
  Origin: string;
  @ApiProperty({
    description: "Stack trace da observabilidade",
    example: "Error at line 42",
  })
  Stack?: string | null;
  @ApiProperty({
    description: "Dados adicionais em formato stringificado",
    example: '{"key":"value"}',
  })
  Stringified?: string | null;
  @ApiProperty({
    description: "Informações adicionais em formato JSON",
    example: { key: "value" },
  })
  info?: Record<string, any> | null;
}
