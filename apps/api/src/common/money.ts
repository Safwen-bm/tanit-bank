import { BadRequestException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";

/** Upper bound for one operation. Keeps amounts far below the Decimal(14,3) column limit. */
export const MAX_OPERATION = new Prisma.Decimal("1000000");

/** Validated string amount -> Decimal. Money is never a JavaScript number. */
export function parseAmount(value: string): Prisma.Decimal {
  const amount = new Prisma.Decimal(value);
  if (amount.lte(0)) {
    throw new BadRequestException("Amount must be greater than zero");
  }
  if (amount.gt(MAX_OPERATION)) {
    throw new BadRequestException("Amount exceeds the maximum of 1000000.000 TND per operation");
  }
  return amount;
}

/** Decimal -> string with the 3 decimals of the Tunisian dinar (millimes). */
export const money = (value: Prisma.Decimal) => value.toFixed(3);

export const AMOUNT_PATTERN = /^\d{1,7}(\.\d{1,3})?$/;