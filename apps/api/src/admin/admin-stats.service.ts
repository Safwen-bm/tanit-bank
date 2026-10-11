import { Injectable } from "@nestjs/common";
import { money } from "../common/money";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const DAY = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 14;

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const zero = new Prisma.Decimal(0);
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY);
    const startOfSeries = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (SERIES_DAYS - 1)));
    const customerAccounts = { type: { not: "TREASURY" as const }, status: { not: "CLOSED" as const } };

    const [customers, newCustomers, openAccounts, deposits, activeLoans, pendingLoans, outstanding, transfers, daily] =
      await Promise.all([
        this.prisma.user.count({ where: { role: "CUSTOMER" } }),
        this.prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: since30 } } }),
        this.prisma.account.count({ where: customerAccounts }),
        this.prisma.account.aggregate({ _sum: { balance: true }, where: customerAccounts }),
        this.prisma.loan.count({ where: { status: "APPROVED" } }),
        this.prisma.loan.count({ where: { status: "PENDING" } }),
        this.prisma.loanInstallment.aggregate({ _sum: { principal: true }, where: { status: "UNPAID" } }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          _count: { _all: true },
          where: { type: "TRANSFER", createdAt: { gte: since30 } },
        }),
        this.prisma.$queryRaw<{ day: string; count: number; volume: string }[]>`
          SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
                 COUNT(*)::int AS count,
                 COALESCE(SUM(amount), 0)::text AS volume
          FROM "Transaction"
          WHERE "createdAt" >= ${startOfSeries}
          GROUP BY 1
          ORDER BY 1`,
      ]);

    const byDay = new Map(daily.map((row) => [row.day, row]));
    const series = Array.from({ length: SERIES_DAYS }, (_, index) => {
      const date = new Date(startOfSeries.getTime() + index * DAY).toISOString().slice(0, 10);
      const row = byDay.get(date);
      return {
        date,
        transactions: row?.count ?? 0,
        volume: new Prisma.Decimal(row?.volume ?? 0).toFixed(3),
      };
    });

    return {
      customers,
      newCustomers30d: newCustomers,
      openAccounts,
      totalDeposits: money(deposits._sum.balance ?? zero),
      activeLoans,
      pendingLoans,
      outstandingPrincipal: money(outstanding._sum.principal ?? zero),
      transfers30d: { count: transfers._count._all, volume: money(transfers._sum.amount ?? zero) },
      series,
    };
  }
}