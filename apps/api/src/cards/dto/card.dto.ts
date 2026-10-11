import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from "class-validator";
import { AMOUNT_PATTERN } from "../../common/money";

export class IssueCardDto {
  @ApiProperty({ description: "Account the card spends from" })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ example: "1500", description: "Monthly spending limit in TND (default 1000)" })
  @IsOptional()
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: "spendingLimit must be a positive number with up to 3 decimals" })
  spendingLimit?: string;
}

export class UpdateCardDto {
  @ApiPropertyOptional({ enum: ["ACTIVE", "FROZEN"] })
  @IsOptional()
  @IsIn(["ACTIVE", "FROZEN"])
  status?: "ACTIVE" | "FROZEN";

  @ApiPropertyOptional({ example: "2000" })
  @IsOptional()
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: "spendingLimit must be a positive number with up to 3 decimals" })
  spendingLimit?: string;
}

export class CardPaymentDto {
  @ApiProperty({ example: "Carrefour Lac 2" })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  merchant: string;

  @ApiProperty({ example: "42.350" })
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: "amount must be a positive number with up to 3 decimals" })
  amount: string;
}