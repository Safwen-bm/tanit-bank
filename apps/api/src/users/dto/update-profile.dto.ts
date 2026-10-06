import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "2800.000" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,10}(\.\d{1,3})?$/, { message: "monthlyIncome must be a positive amount with up to 3 decimals" })
  monthlyIncome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[+0-9 ]{8,20}$/, { message: "phone must contain 8 to 20 digits, spaces or +" })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}