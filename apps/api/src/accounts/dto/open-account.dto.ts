import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class OpenAccountDto {
  @ApiProperty({ enum: ["CURRENT", "SAVINGS"] })
  @IsIn(["CURRENT", "SAVINGS"])
  type: "CURRENT" | "SAVINGS";

  @ApiPropertyOptional({ example: "Holiday fund" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;
}