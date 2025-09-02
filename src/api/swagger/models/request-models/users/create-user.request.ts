import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class CreateUser {
  @ApiProperty({
    description: "The first name of the user",
    example: "Adrian",
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "The last name of the user",
    example: "Lopes",
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "The email of the user",
    example: "adrian.lopes@example.com",
    nullable: false,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "The password of the user",
    example: "password123",
    nullable: false,
    required: true,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description:
      "The phone number of the user (BR format: DDD + 9 dígitos, ex: 51999999999)",
    example: "51999999999",
    nullable: false,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}9\d{8}$/, {
    message:
      "Phone number must be in BR format: DDD + 9 dígitos, ex: 51999999999",
  })
  phoneNumber: string;
}
