import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class LoginRequest {
  @ApiProperty({
    description: "Email do usuário",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "senha123",
  })
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
