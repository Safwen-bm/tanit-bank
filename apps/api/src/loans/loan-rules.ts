import { BadRequestException } from "@nestjs/common";
import { LoanProduct, Prisma } from "../generated/prisma/client";

/** The product's limits, with messages a customer can act on. Shared by the simulator and applications. */
export function assertWithinProduct(product: LoanProduct, amount: Prisma.Decimal, months: number) {
  if (amount.lt(product.minAmount)) {
    throw new BadRequestException(`Minimum amount for this product is ${product.minAmount.toFixed(3)} TND`);
  }
  if (amount.gt(product.maxAmount)) {
    throw new BadRequestException(`Maximum amount for this product is ${product.maxAmount.toFixed(3)} TND`);
  }
  if (months < product.minMonths) {
    throw new BadRequestException(`Minimum duration for this product is ${product.minMonths} months`);
  }
  if (months > product.maxMonths) {
    throw new BadRequestException(`Maximum duration for this product is ${product.maxMonths} months`);
  }
}