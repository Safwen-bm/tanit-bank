import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";
import { AMOUNT_PATTERN } from "../../common/money";

export class TransferDto {
  @ApiProperty()
  @IsUUID()
  fromAccountId: string;

  @ApiProperty({ example: "TN59 0800 1000 0000 0000 0116" })
  @IsString()
  @Matches(/^TN[0-9 ]{22,30}$/i, { message: "toIban must be a Tunisian IBAN (TN + 22 digits)" })
  toIban: string;

  @ApiProperty({ example: "25.000" })
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: "amount must be a positive number with up to 3 decimals" })
  amount: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;
}