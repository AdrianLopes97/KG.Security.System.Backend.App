import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class PaginationQuery {
  @ApiProperty({
    description: "Número da página",
    example: 1,
    minimum: 1,
    nullable: false,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    description: "Itens por página",
    example: 10,
    minimum: 1,
    maximum: 100,
    nullable: false,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;
}
