import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

const MONEY = /^\d{1,9}(\.\d{1,3})?$/;
const RATE = /^\d{1,2}(\.\d{1,4})?$/;
const RATIO = /^(0(\.\d{1,4})?|1(\.0{1,4})?)$/;

export class CreateLoanProductDto {
  @ApiProperty({ example: "Personal loan" })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ example: "9.5", description: "Annual rate in percent, up to 4 decimals (0 to 40)" })
  @IsString()
  @Matches(RATE, { message: "annualRate must be a percentage like 9.5 or 12.2500" })
  annualRate: string;

  @ApiProperty({ example: "1000" })
  @IsString()
  @Matches(MONEY, { message: "minAmount must be a positive amount with up to 3 decimals" })
  minAmount: string;

  @ApiProperty({ example: "50000" })
  @IsString()
  @Matches(MONEY, { message: "maxAmount must be a positive amount with up to 3 decimals" })
  maxAmount: string;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(1)
  @Max(360)
  minMonths: number;

  @ApiProperty({ example: 84 })
  @IsInt()
  @Min(1)
  @Max(360)
  maxMonths: number;

  @ApiProperty({ example: "0.4000", description: "Largest share of monthly income a payment may take (0 to 1)" })
  @IsString()
  @Matches(RATIO, { message: "maxDebtRatio must be a fraction between 0 and 1, like 0.4" })
  maxDebtRatio: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLoanProductDto extends PartialType(CreateLoanProductDto) {}