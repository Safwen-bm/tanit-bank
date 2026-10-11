import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { toAccountView } from "../accounts/accounts.service";
import { money } from "../common/money";
import { Prisma } from "../generated/prisma/client";
import { SUMMARY_INCLUDE, toLoanSummary } from "../loans/loan-views";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionsService } from "../transactions/transactions.service";
import { AdminCustomersQueryDto, SetAccountStatusDto } from "./dto/admin.dto";

@Injectable()
export class AdminCustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionsService,
  ) {}

  async list(query: AdminCustomersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const q = query.q?.trim();
    const where: Prisma.UserWhereInput = {
      role: "CUSTOMER",
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          createdAt: true,
          profile: { select: { monthlyIncome: true } },
          accounts: { select: { balance: true, status: true } },
          loans: { where: { status: "APPROVED" }, select: { id: true } },
        },
      }),
    ]);

    return {
      items: users.map((user) => {
        const open = user.accounts.filter((account) => account.status !== "CLOSED");
        const balance = open.reduce((sum, account) => sum.plus(account.balance), new Prisma.Decimal(0));
        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
          monthlyIncome: user.profile?.monthlyIncome.toFixed(3) ?? null,
          accounts: open.length,
          totalBalance: money(balance),
          activeLoans: user.loans.length,
        };
      }),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async get(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: "CUSTOMER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        createdAt: true,
        profile: { select: { monthlyIncome: true, phone: true, address: true } },
        accounts: { orderBy: { createdAt: "asc" } },
        loans: { include: SUMMARY_INCLUDE, orderBy: { createdAt: "desc" } },
      },
    });
    if (!user) throw new NotFoundException("Customer not found");

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: user.profile && {
        monthlyIncome: user.profile.monthlyIncome.toFixed(3),
        phone: user.profile.phone,
        address: user.profile.address,
      },
      accounts: user.accounts.map(toAccountView),
      loans: user.loans.map(toLoanSummary),
      recent: await this.transactions.recent(user.id, 10),
    };
  }

  /** Deactivating also ends every session. The JWT strategy then refuses the old access token at once. */
  async setActive(id: string, isActive: boolean, adminId: string, ip?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, role: "CUSTOMER" }, select: { id: true } });
    if (!user) throw new NotFoundException("Customer not found");

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { isActive } });
      if (!isActive) {
        await tx.refreshSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: isActive ? "CUSTOMER_REACTIVATE" : "CUSTOMER_DEACTIVATE",
          entity: "User",
          entityId: id,
          ip,
        },
      });
    });
    return { id, isActive };
  }

  /** The account row is locked first, so a transfer in flight cannot slip past a freeze or a close. */
  async setAccountStatus(accountId: string, dto: SetAccountStatusDto, adminId: string, ip?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id" = ${accountId} FOR UPDATE`;
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account || account.type === "TREASURY") throw new NotFoundException("Account not found");
      if (account.status === dto.status) return toAccountView(account);

      if (dto.status === "CLOSED") {
        if (!account.balance.isZero()) {
          throw new UnprocessableEntityException("The balance must be zero before an account can be closed");
        }
        const linked = await tx.loan.count({
          where: { accountId, status: { in: ["PENDING", "APPROVED"] } },
        });
        if (linked > 0) {
          throw new ConflictException("This account is linked to a pending or active loan");
        }
      }

      const updated = await tx.account.update({
        where: { id: accountId },
        data: { status: dto.status, closedAt: dto.status === "CLOSED" ? new Date() : null },
      });

      if (account.userId) {
        const verb = { ACTIVE: "reactivated", FROZEN: "frozen", CLOSED: "closed" }[dto.status];
        await tx.notification.create({
          data: {
            userId: account.userId,
            title: `Account ${verb}`,
            body: `Your account ${account.iban} was ${verb} by the bank.`,
            link: `/accounts/${account.id}`,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "ACCOUNT_STATUS",
          entity: "Account",
          entityId: accountId,
          metadata: { from: account.status, to: dto.status, iban: account.iban },
          ip,
        },
      });
      return toAccountView(updated);
    });
  }
}