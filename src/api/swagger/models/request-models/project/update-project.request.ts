import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { UpdateMonitoringRulesPartialRequest } from "../monitoring-rules/update-monitoring-rules.partial.request";

export class UpdateProjectRequest {
  @ApiProperty({
    description: "Nome do projeto",
    example: "Meu Projeto",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "URL do repositório GitHub",
    example: "https://github.com/usuario/repositorio",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  githubUrl?: string | null;

  @ApiProperty({
    description: "URL do sistema monitorado",
    example: "https://meusistema.com",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  systemUrl?: string | null;

  @ApiProperty({
    description: "Regras de monitoramento a serem criadas",
    type: UpdateMonitoringRulesPartialRequest,
    required: false,
    nullable: true,
  })
  @IsOptional()
  monitoringRules?: UpdateMonitoringRulesPartialRequest | null;
}
