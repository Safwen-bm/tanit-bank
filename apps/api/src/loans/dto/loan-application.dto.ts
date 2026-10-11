import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { AMOUNT_PATTERN } from "../../common/money";

export class ApplyLoanDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: "Account that receives the money" })
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: "10000" })
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: "amount must be a positive number with up to 3 decimals" })
  amount: string;

  @ApiProperty({ example: 24 })
  @IsInt()
  @Min(1)
  @Max(360)
  months: number;

  @ApiPropertyOptional({ example: "New car" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;
}

export class RepayDto {
  @ApiPropertyOptional({ description: "Account to debit. Defaults to the account that received the loan." })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}

export class ApproveLoanDto {
  @ApiPropertyOptional({ description: "Required to approve an application that exceeds the product's debt ratio" })
  @IsOptional()
  @IsBoolean()
  overrideDebtRatio?: boolean;
}

export class RejectLoanDto {
  @ApiProperty({ example: "Debt ratio too high for the declared income." })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason: string;
}

export class AdminApplicationsQueryDto {
  @ApiPropertyOptional({ enum: ["PENDING", "APPROVED", "REJECTED", "PAID_OFF", "ALL"], default: "PENDING" })
  @IsOptional()
  @IsIn(["PENDING", "APPROVED", "REJECTED", "PAID_OFF", "ALL"])
  status?: "PENDING" | "APPROVED" | "REJECTED" | "PAID_OFF" | "ALL";

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}