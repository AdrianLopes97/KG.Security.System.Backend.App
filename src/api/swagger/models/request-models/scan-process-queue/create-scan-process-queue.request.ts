import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { ScanType } from "~/types/enums/scan-type.enums";

export class CreateScanProcessQueueRequest {
  @ApiProperty({
    description: "ID do projeto associado ao processo de varredura",
    example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    required: true,
    nullable: false,
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description:
      "Regras de monitoramento opcionais para o processo de varredura",
    required: true,
    enum: ScanType,
    example: ScanType.STATIC,
    nullable: false,
  })
  @IsNotEmpty()
  scanType: ScanType;
}
