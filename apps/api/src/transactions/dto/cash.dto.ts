import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";
import { AMOUNT_PATTERN } from "../../common/money";

export class CashDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: "150.500", description: "Amount in TND, up to 3 decimals" })
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: "amount must be a positive number with up to 3 decimals" })
  amount: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;
}