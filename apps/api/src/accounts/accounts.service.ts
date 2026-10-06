import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { money } from "../common/money";
import { isUniqueViolation } from "../common/prisma-errors";
import { randomTnIban } from "../common/iban";
import { Account } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { OpenAccountDto } from "./dto/open-account.dto";

const MAX_OPEN_ACCOUNTS = 5;

export function toAccountView(account: Account) {
  return {
    id: account.id,
    iban: account.iban,
    type: account.type,
    status: account.status,
    balance: money(account.balance),
    currency: account.currency,
    label: account.label,
    createdAt: account.createdAt,
  };
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return accounts.map(toAccountView);
  }

  /** Ownership check. A foreign account answers 404, so its existence is never revealed. */
  async getOwned(userId: string, accountId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundException("Account not found");
    return account;
  }

  async getView(userId: string, accountId: string) {
    return toAccountView(await this.getOwned(userId, accountId));
  }

  async open(userId: string, dto: OpenAccountDto, ip?: string) {
    const openCount = await this.prisma.account.count({
      where: { userId, status: { not: "CLOSED" } },
    });
    if (openCount >= MAX_OPEN_ACCOUNTS) {
      throw new BadRequestException(`You can have at most ${MAX_OPEN_ACCOUNTS} open accounts`);
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const account = await this.prisma.account.create({
          data: { userId, type: dto.type, label: dto.label?.trim() || null, iban: randomTnIban() },
        });
        await this.audit.log({
          userId,
          action: "ACCOUNT_OPEN",
          entity: "Account",
          entityId: account.id,
          metadata: { type: account.type },
          ip,
        });
        return toAccountView(account);
      } catch (error) {
        if (isUniqueViolation(error)) continue; // IBAN collision, draw another one
        throw error;
      }
    }
    throw new InternalServerErrorException("Could not generate a unique IBAN");
  }

  openDefault(userId: string, ip?: string) {
    return this.open(userId, { type: "CURRENT", label: "Main account" }, ip);
  }
}