import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { parseAmount, money } from "../common/money";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CashDto } from "./dto/cash.dto";
import { HistoryQueryDto } from "./dto/history-query.dto";
import { TransferDto } from "./dto/transfer.dto";
import { LedgerService } from "./ledger.service";
import { TX_INCLUDE, toTransactionView } from "./transaction.view";

interface Meta {
  ip?: string;
  idempotencyKey?: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
    private readonly ledger: LedgerService,
  ) {}

  async deposit(userId: string, dto: CashDto, meta: Meta) {
    const account = await this.accounts.getOwned(userId, dto.accountId);
    const { transaction, replayed } = await this.ledger.post({
      type: "DEPOSIT",
      amount: parseAmount(dto.amount),
      fromAccountId: await this.ledger.getTreasuryId(),
      toAccountId: account.id,
      description: dto.description?.trim() || "Cash deposit",
      initiatedById: userId,
      idempotencyKey: meta.idempotencyKey,
      audit: { action: "TX_DEPOSIT", ip: meta.ip },
    });
    return { transaction: toTransactionView(transaction, account.id), replayed };
  }

  async withdraw(userId: string, dto: CashDto, meta: Meta) {
    const account = await this.accounts.getOwned(userId, dto.accountId);
    const { transaction, replayed } = await this.ledger.post({
      type: "WITHDRAWAL",
      amount: parseAmount(dto.amount),
      fromAccountId: account.id,
      toAccountId: await this.ledger.getTreasuryId(),
      description: dto.description?.trim() || "Cash withdrawal",
      initiatedById: userId,
      idempotencyKey: meta.idempotencyKey,
      audit: { action: "TX_WITHDRAWAL", ip: meta.ip },
    });
    return { transaction: toTransactionView(transaction, account.id), replayed };
  }

  async transfer(userId: string, dto: TransferDto, meta: Meta) {
    const from = await this.accounts.getOwned(userId, dto.fromAccountId);
    const iban = dto.toIban.replace(/\s+/g, "").toUpperCase();

    const target = await this.prisma.account.findUnique({ where: { iban } });
    if (!target || target.type === "TREASURY") {
      throw new NotFoundException("Recipient account not found");
    }
    if (target.id === from.id) {
      throw new UnprocessableEntityException("Choose a different destination account");
    }

    const amount = parseAmount(dto.amount);
    const sender = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { fullName: true },
    });

    const { transaction, replayed } = await this.ledger.post({
      type: "TRANSFER",
      amount,
      fromAccountId: from.id,
      toAccountId: target.id,
      description: dto.description?.trim() || null,
      initiatedById: userId,
      idempotencyKey: meta.idempotencyKey,
      audit: { action: "TX_TRANSFER", ip: meta.ip },
      notifyRecipient:
        target.userId && target.userId !== userId
          ? {
              userId: target.userId,
              title: "Money received",
              body: `${sender.fullName} sent you ${money(amount)} TND`,
              link: `/accounts/${target.id}`,
            }
          : undefined,
    });
    return { transaction: toTransactionView(transaction, from.id), replayed };
  }

  async history(userId: string, accountId: string, query: HistoryQueryDto) {
    await this.accounts.getOwned(userId, accountId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const filters: Prisma.TransactionWhereInput[] = [
      { OR: [{ fromAccountId: accountId }, { toAccountId: accountId }] },
    ];
    if (query.type) filters.push({ type: query.type });
    if (query.from || query.to) {
      const range: Prisma.DateTimeFilter = {};
      if (query.from) range.gte = new Date(query.from);
      if (query.to) {
        const end = new Date(query.to);
        end.setUTCDate(end.getUTCDate() + 1); // "to" is inclusive
        range.lt = end;
      }
      filters.push({ createdAt: range });
    }
    const q = query.q?.trim();
    if (q) {
      const iban = q.replace(/\s+/g, "").toUpperCase();
      filters.push({
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { fromAccount: { iban: { contains: iban } } },
          { toAccount: { iban: { contains: iban } } },
        ],
      });
    }
    const where: Prisma.TransactionWhereInput = { AND: filters };

    const [total, rows] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: TX_INCLUDE,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => toTransactionView(row, accountId)),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Latest activity across all of the customer's accounts (dashboard). */
  async recent(userId: string, limit: number) {
    const mine = await this.prisma.account.findMany({ where: { userId }, select: { id: true } });
    const ids = mine.map((a) => a.id);
    if (ids.length === 0) return [];

    const rows = await this.prisma.transaction.findMany({
      where: { OR: [{ fromAccountId: { in: ids } }, { toAccountId: { in: ids } }] },
      include: TX_INCLUDE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });

    return rows.map((row) => {
      // Money leaving one of my accounts is shown from that account; otherwise from the receiving one.
      const perspective = row.fromAccountId && ids.includes(row.fromAccountId) ? row.fromAccountId : row.toAccountId!;
      const account = perspective === row.fromAccountId ? row.fromAccount : row.toAccount;
      return { ...toTransactionView(row, perspective), accountId: perspective, accountIban: account?.iban ?? "" };
    });
  }
}