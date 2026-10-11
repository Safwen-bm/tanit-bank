import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, IsUUID, Matches, Max, Min } from "class-validator";
import { AMOUNT_PATTERN } from "../../common/money";

export class SimulationDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: "20000", description: "Loan amount in TND" })
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: "amount must be a positive number with up to 3 decimals" })
  amount: string;

  @ApiProperty({ example: 48, description: "Duration in months" })
  @IsInt()
  @Min(1)
  @Max(360)
  months: number;
}