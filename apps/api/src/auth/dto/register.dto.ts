import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "amel@example.com" })
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiProperty({ minLength: 10, description: "At least 10 characters, with a letter and a digit" })
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: "password must contain a letter and a digit" })
  password: string;

  @ApiProperty({ example: "Amel Trabelsi" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  fullName: string;

  @ApiProperty({ example: "2500.000", description: "Declared monthly income in TND, up to 3 decimals" })
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,3})?$/, { message: "monthlyIncome must be a positive amount with up to 3 decimals" })
  monthlyIncome: string;

  @ApiProperty({ required: false, example: "+216 20 123 456" })
  @IsOptional()
  @IsString()
  @Matches(/^[+0-9 ]{8,20}$/, { message: "phone must contain 8 to 20 digits, spaces or +" })
  phone?: string;
}