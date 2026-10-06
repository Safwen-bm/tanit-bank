import { Injectable } from "@nestjs/common";
import { money } from "../common/money";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every movement debits one account and credits another, so the sum of all
   * balances (customers + treasury) must always be exactly zero.
   */
  async ledgerCheck() {
    const zero = new Prisma.Decimal(0);
    const [all, treasury, accounts] = await Promise.all([
      this.prisma.account.aggregate({ _sum: { balance: true } }),
      this.prisma.account.aggregate({ _sum: { balance: true }, where: { type: "TREASURY" } }),
      this.prisma.account.count(),
    ]);
    const total = all._sum.balance ?? zero;
    const treasuryBalance = treasury._sum.balance ?? zero;
    return {
      balanced: total.isZero(),
      total: money(total),
      treasury: money(treasuryBalance),
      customers: money(total.minus(treasuryBalance)),
      accounts,
    };
  }
}