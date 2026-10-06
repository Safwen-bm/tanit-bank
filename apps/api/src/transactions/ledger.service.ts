import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { isUniqueViolation } from "../common/prisma-errors";
import { Prisma } from "../generated/prisma/client";
import { TransactionType } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { TX_INCLUDE, TransactionWithAccounts } from "./transaction.view";

export interface PostInput {
  type: TransactionType;
  amount: Prisma.Decimal;
  fromAccountId: string;
  toAccountId: string;
  description?: string | null;
  initiatedById: string;
  idempotencyKey?: string;
  audit: { action: string; ip?: string };
  notifyRecipient?: { userId: string; title: string; body: string; link?: string };
}

export interface PostResult {
  transaction: TransactionWithAccounts;
  replayed: boolean;
}

/**
 * The only place where balances change. Every movement is one database transaction:
 *   1. lock both account rows, always in id order (no deadlocks),
 *   2. re-read them and check status and funds,
 *   3. debit, credit, write the Transaction, the audit log and the notification.
 * All or nothing. The TREASURY account is the bank's side of cash movements and
 * loans, and is the only account allowed to go negative.
 */
@Injectable()
export class LedgerService {
  private treasuryId?: string;

  constructor(private readonly prisma: PrismaService) {}

  async getTreasuryId(): Promise<string> {
    if (!this.treasuryId) {
      const treasury = await this.prisma.account.findFirst({
        where: { type: "TREASURY" },
        select: { id: true },
      });
      if (!treasury) {
        throw new InternalServerErrorException("Treasury account is missing. Run: npm run db:seed");
      }
      this.treasuryId = treasury.id;
    }
    return this.treasuryId;
  }

  async post(input: PostInput): Promise<PostResult> {
    if (input.fromAccountId === input.toAccountId) {
      throw new UnprocessableEntityException("Source and destination accounts must differ");
    }

    // Fast path: the same key sent again returns the original result.
    const known = await this.findByKey(input);
    if (known) return { transaction: known, replayed: true };

    try {
      const transaction = await this.prisma.$transaction((tx) => this.apply(tx, input), {
        maxWait: 5_000,
        timeout: 15_000,
      });
      return { transaction, replayed: false };
    } catch (error) {
      // Two identical requests raced: the loser hits the unique key and rolls back entirely.
      if (input.idempotencyKey && isUniqueViolation(error)) {
        const winner = await this.findByKey(input);
        if (winner) return { transaction: winner, replayed: true };
      }
      throw error;
    }
  }

  private async findByKey(input: PostInput): Promise<TransactionWithAccounts | null> {
    if (!input.idempotencyKey) return null;
    const existing = await this.prisma.transaction.findUnique({
      where: {
        initiatedById_idempotencyKey: {
          initiatedById: input.initiatedById,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: TX_INCLUDE,
    });
    if (!existing) return null;

    const same =
      existing.type === input.type &&
      existing.fromAccountId === input.fromAccountId &&
      existing.toAccountId === input.toAccountId &&
      existing.amount.equals(input.amount);
    if (!same) {
      throw new ConflictException("This Idempotency-Key was already used for a different operation");
    }
    return existing;
  }

  private async apply(tx: Prisma.TransactionClient, input: PostInput): Promise<TransactionWithAccounts> {
    const ids = [input.fromAccountId, input.toAccountId].sort();

    // Row locks, in a fixed order. A concurrent transfer touching the same accounts waits here.
    await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`;

    // Read after locking: these balances cannot change until we commit.
    const accounts = await tx.account.findMany({ where: { id: { in: ids } } });
    const from = accounts.find((a) => a.id === input.fromAccountId);
    const to = accounts.find((a) => a.id === input.toAccountId);
    if (!from || !to) throw new NotFoundException("Account not found");

    for (const account of [from, to]) {
      if (account.type !== "TREASURY" && account.status !== "ACTIVE") {
        throw new UnprocessableEntityException("A closed or frozen account cannot send or receive money");
      }
    }
    if (from.type !== "TREASURY" && from.balance.lt(input.amount)) {
      throw new UnprocessableEntityException("Insufficient funds");
    }

    await tx.account.update({
      where: { id: from.id },
      data: { balance: { decrement: input.amount } },
    });
    await tx.account.update({
      where: { id: to.id },
      data: { balance: { increment: input.amount } },
    });

    const record = await tx.transaction.create({
      data: {
        type: input.type,
        amount: input.amount,
        fromAccountId: from.id,
        toAccountId: to.id,
        fromBalanceAfter: from.balance.minus(input.amount),
        toBalanceAfter: to.balance.plus(input.amount),
        description: input.description ?? null,
        initiatedById: input.initiatedById,
        idempotencyKey: input.idempotencyKey,
      },
      include: TX_INCLUDE,
    });

    await tx.auditLog.create({
      data: {
        userId: input.initiatedById,
        action: input.audit.action,
        entity: "Transaction",
        entityId: record.id,
        metadata: {
          type: input.type,
          amount: input.amount.toFixed(3),
          from: from.iban,
          to: to.iban,
        },
        ip: input.audit.ip,
      },
    });

    if (input.notifyRecipient) {
      await tx.notification.create({ data: input.notifyRecipient });
    }
    return record;
  }
}