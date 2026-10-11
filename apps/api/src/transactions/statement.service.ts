import { Injectable, Logger, UnprocessableEntityException } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { AuditService } from "../audit/audit.service";
import { money } from "../common/money";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { renderStatement, StatementRow } from "./statement-pdf";
import { TX_INCLUDE } from "./transaction.view";

const MAX_ROWS = 2000;

const TITLES: Record<string, string> = {
  DEPOSIT: "Cash deposit",
  WITHDRAWAL: "Cash withdrawal",
  TRANSFER: "Transfer",
  LOAN_DISBURSEMENT: "Loan disbursement",
  LOAN_REPAYMENT: "Loan repayment",
  CARD_PAYMENT: "Card payment",
};

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

@Injectable()
export class StatementService {
  private readonly logger = new Logger(StatementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
    private readonly audit: AuditService,
  ) {}

  async pdf(userId: string, accountId: string, from?: string, to?: string, ip?: string) {
    const account = await this.accounts.getOwned(userId, accountId);
    const holder = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });

    const start = from ? new Date(from) : undefined;
    const endExclusive = to ? new Date(to) : undefined;
    endExclusive?.setUTCDate(endExclusive.getUTCDate() + 1); // "to" is inclusive

    const involvesAccount: Prisma.TransactionWhereInput = {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
    };
    const range: Prisma.DateTimeFilter = {};
    if (start) range.gte = start;
    if (endExclusive) range.lt = endExclusive;

    const rows = await this.prisma.transaction.findMany({
      where: { AND: [involvesAccount, Object.keys(range).length > 0 ? { createdAt: range } : {}] },
      include: TX_INCLUDE,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: MAX_ROWS + 1,
    });
    if (rows.length > MAX_ROWS) {
      throw new UnprocessableEntityException(
        `This period has more than ${MAX_ROWS} transactions. Choose a shorter period.`,
      );
    }

    // Opening balance = the balance recorded right after the last movement before the period.
    let opening = new Prisma.Decimal(0);
    if (start) {
      const before = await this.prisma.transaction.findFirst({
        where: { AND: [involvesAccount, { createdAt: { lt: start } }] },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { toAccountId: true, toBalanceAfter: true, fromBalanceAfter: true },
      });
      if (before) {
        opening = (before.toAccountId === accountId ? before.toBalanceAfter : before.fromBalanceAfter) ?? opening;
      }
    }

    let totalIn = new Prisma.Decimal(0);
    let totalOut = new Prisma.Decimal(0);
    let closing = opening;

    const lines: StatementRow[] = rows.map((row) => {
      const incoming = row.toAccountId === accountId;
      const other = incoming ? row.fromAccount : row.toAccount;
      const balance = incoming ? row.toBalanceAfter : row.fromBalanceAfter;
      if (incoming) totalIn = totalIn.plus(row.amount);
      else totalOut = totalOut.plus(row.amount);
      if (balance) closing = balance;

      const name = other?.type === "TREASURY" ? "Tanit Bank" : (other?.user?.fullName ?? "");
      return {
        date: row.createdAt,
        title: row.description || TITLES[row.type] || row.type,
        party: other ? `${incoming ? "from" : "to"} ${name} (${other.iban.slice(-6)})` : TITLES[row.type],
        debit: incoming ? null : money(row.amount),
        credit: incoming ? money(row.amount) : null,
        balance: balance ? money(balance) : null,
      };
    });

    if (!opening.plus(totalIn).minus(totalOut).equals(closing)) {
      // Cannot happen if the ledger is sound; if it ever does, it must be loud.
      this.logger.error(`Statement does not add up for account ${accountId}`);
      throw new UnprocessableEntityException("This statement could not be verified. Please contact the bank.");
    }

    const periodLabel =
      start || endExclusive
        ? `${start ? isoDay(start) : "opening"} to ${to ?? "today"}`
        : "Since opening";

    const buffer = await renderStatement({
      holder: holder.fullName,
      iban: account.iban,
      accountName: `${account.label ?? "Account"} (${account.type === "CURRENT" ? "current" : "savings"})`,
      currency: account.currency,
      periodLabel,
      generatedAt: new Date(),
      opening: money(opening),
      totalIn: money(totalIn),
      totalOut: money(totalOut),
      closing: money(closing),
      rows: lines,
    });

    await this.audit.log({
      userId,
      action: "STATEMENT_DOWNLOAD",
      entity: "Account",
      entityId: accountId,
      metadata: { from: from ?? null, to: to ?? null, rows: lines.length },
      ip,
    });

    return { buffer, filename: `statement-${account.iban}-${isoDay(new Date())}.pdf` };
  }
}