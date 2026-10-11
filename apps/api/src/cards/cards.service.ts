import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import { AccountsService } from "../accounts/accounts.service";
import { AuditService } from "../audit/audit.service";
import { money, parseAmount } from "../common/money";
import { Card, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../transactions/ledger.service";
import { toTransactionView } from "../transactions/transaction.view";
import { CardPaymentDto, IssueCardDto, UpdateCardDto } from "./dto/card.dto";

const MAX_CARDS = 3;
const DEFAULT_LIMIT = "1000";
const MAX_LIMIT = new Prisma.Decimal(50_000);

type CardWithAccount = Card & { account: { id: string; iban: string; label: string | null; userId: string | null } };

const startOfMonthUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string) {
    const cards = await this.prisma.card.findMany({
      where: { account: { userId } },
      include: { account: { select: { id: true, iban: true, label: true, userId: true } } },
      orderBy: { createdAt: "asc" },
    });
    const spent = await this.spentThisMonth(cards.map((card) => card.id));
    return cards.map((card) => this.toView(card, spent.get(card.id) ?? new Prisma.Decimal(0)));
  }

  async issue(userId: string, dto: IssueCardDto, ip?: string) {
    const account = await this.accounts.getOwned(userId, dto.accountId);
    if (account.status !== "ACTIVE") throw new UnprocessableEntityException("The account must be active");

    const count = await this.prisma.card.count({ where: { account: { userId } } });
    if (count >= MAX_CARDS) throw new UnprocessableEntityException(`You can have at most ${MAX_CARDS} cards`);

    const limit = this.parseLimit(dto.spendingLimit ?? DEFAULT_LIMIT);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { fullName: true } });
    const now = new Date();

    const card = await this.prisma.card.create({
      data: {
        accountId: account.id,
        holderName: user.fullName.toUpperCase(),
        // Only the last four digits exist. The full number is never generated or stored.
        last4: String(randomInt(0, 10_000)).padStart(4, "0"),
        expiryMonth: now.getUTCMonth() + 1,
        expiryYear: now.getUTCFullYear() + 4,
        spendingLimit: limit,
      },
      include: { account: { select: { id: true, iban: true, label: true, userId: true } } },
    });
    await this.audit.log({
      userId,
      action: "CARD_ISSUE",
      entity: "Card",
      entityId: card.id,
      metadata: { limit: limit.toFixed(3), accountId: account.id },
      ip,
    });
    return this.toView(card, new Prisma.Decimal(0));
  }

  async update(userId: string, id: string, dto: UpdateCardDto, ip?: string) {
    if (dto.status === undefined && dto.spendingLimit === undefined) {
      throw new BadRequestException("Nothing to change");
    }
    const current = await this.getOwned(userId, id);
    const limit = dto.spendingLimit === undefined ? undefined : this.parseLimit(dto.spendingLimit);

    const card = await this.prisma.card.update({
      where: { id },
      data: { status: dto.status, spendingLimit: limit },
      include: { account: { select: { id: true, iban: true, label: true, userId: true } } },
    });
    await this.audit.log({
      userId,
      action: "CARD_UPDATE",
      entity: "Card",
      entityId: id,
      metadata: {
        status: { from: current.status, to: card.status },
        limit: { from: current.spendingLimit.toFixed(3), to: card.spendingLimit.toFixed(3) },
      },
      ip,
    });
    const spent = await this.spentThisMonth([id]);
    return this.toView(card, spent.get(id) ?? new Prisma.Decimal(0));
  }

  /**
   * Simulated purchase. The card row is locked inside the money transaction, so two payments
   * racing each other cannot both slip under the monthly limit, and a freeze takes effect at once.
   */
  async pay(userId: string, id: string, dto: CardPaymentDto, idempotencyKey: string | undefined, ip?: string) {
    const card = await this.getOwned(userId, id);
    const amount = parseAmount(dto.amount);
    const monthStart = startOfMonthUtc();

    const { transaction, replayed } = await this.ledger.post(
      {
        type: "CARD_PAYMENT",
        amount,
        fromAccountId: card.accountId,
        toAccountId: await this.ledger.getTreasuryId(),
        description: `Card payment: ${dto.merchant.trim()}`,
        initiatedById: userId,
        idempotencyKey,
        cardId: card.id,
        audit: { action: "TX_CARD_PAYMENT", ip },
      },
      {
        before: async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Card" WHERE "id" = ${card.id} FOR UPDATE`;
          const fresh = await tx.card.findUniqueOrThrow({ where: { id: card.id } });
          if (fresh.status !== "ACTIVE") throw new UnprocessableEntityException("This card is frozen");

          const spent = await tx.transaction.aggregate({
            _sum: { amount: true },
            where: { cardId: card.id, type: "CARD_PAYMENT", createdAt: { gte: monthStart } },
          });
          const used = spent._sum.amount ?? new Prisma.Decimal(0);
          if (used.plus(amount).gt(fresh.spendingLimit)) {
            const left = Prisma.Decimal.max(fresh.spendingLimit.minus(used), 0);
            throw new UnprocessableEntityException(
              `Monthly card limit reached. ${money(left)} TND left this month.`,
            );
          }
        },
      },
    );

    const spent = await this.spentThisMonth([card.id]);
    return {
      transaction: toTransactionView(transaction, card.accountId),
      replayed,
      card: this.toView(card, spent.get(card.id) ?? new Prisma.Decimal(0)),
    };
  }

  // ───────────── helpers ─────────────

  private async getOwned(userId: string, id: string): Promise<CardWithAccount> {
    const card = await this.prisma.card.findFirst({
      where: { id, account: { userId } },
      include: { account: { select: { id: true, iban: true, label: true, userId: true } } },
    });
    if (!card) throw new NotFoundException("Card not found");
    return card;
  }

  private parseLimit(value: string): Prisma.Decimal {
    const limit = new Prisma.Decimal(value);
    if (limit.lte(0)) throw new BadRequestException("The limit must be greater than zero");
    if (limit.gt(MAX_LIMIT)) throw new BadRequestException("The monthly limit cannot exceed 50000.000 TND");
    return limit;
  }

  private async spentThisMonth(cardIds: string[]) {
    const map = new Map<string, Prisma.Decimal>();
    if (cardIds.length === 0) return map;
    const grouped = await this.prisma.transaction.groupBy({
      by: ["cardId"],
      _sum: { amount: true },
      where: { cardId: { in: cardIds }, type: "CARD_PAYMENT", createdAt: { gte: startOfMonthUtc() } },
    });
    for (const row of grouped) if (row.cardId) map.set(row.cardId, row._sum.amount ?? new Prisma.Decimal(0));
    return map;
  }

  private toView(card: CardWithAccount, spent: Prisma.Decimal) {
    const remaining = Prisma.Decimal.max(card.spendingLimit.minus(spent), 0);
    return {
      id: card.id,
      holderName: card.holderName,
      last4: card.last4,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      status: card.status,
      spendingLimit: money(card.spendingLimit),
      spentThisMonth: money(spent),
      remainingThisMonth: money(remaining),
      account: { id: card.account.id, iban: card.account.iban, label: card.account.label },
      createdAt: card.createdAt,
    };
  }
}