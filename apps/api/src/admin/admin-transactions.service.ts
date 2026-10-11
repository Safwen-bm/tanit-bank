import { Injectable } from "@nestjs/common";
import { money } from "../common/money";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TX_INCLUDE, TransactionWithAccounts } from "../transactions/transaction.view";
import { AdminTransactionsQueryDto } from "./dto/admin.dto";

const ADMIN_INCLUDE = {
  ...TX_INCLUDE,
  initiatedBy: { select: { fullName: true } },
} satisfies Prisma.TransactionInclude;

type Row = Prisma.TransactionGetPayload<{ include: typeof ADMIN_INCLUDE }>;

function party(account: TransactionWithAccounts["fromAccount"]) {
  if (!account) return null;
  return {
    iban: account.iban,
    name: account.type === "TREASURY" ? "Tanit Bank (treasury)" : (account.user?.fullName ?? "Unknown"),
  };
}

@Injectable()
export class AdminTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminTransactionsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 15;

    const filters: Prisma.TransactionWhereInput[] = [];
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
      const person = (relation: "fromAccount" | "toAccount"): Prisma.TransactionWhereInput => ({
        [relation]: {
          user: {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      });
      filters.push({
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { fromAccount: { iban: { contains: iban } } },
          { toAccount: { iban: { contains: iban } } },
          person("fromAccount"),
          person("toAccount"),
        ],
      });
    }
    const where: Prisma.TransactionWhereInput = filters.length > 0 ? { AND: filters } : {};

    const [total, rows] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: ADMIN_INCLUDE,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row: Row) => ({
        id: row.id,
        type: row.type,
        amount: money(row.amount),
        description: row.description,
        createdAt: row.createdAt,
        from: party(row.fromAccount),
        to: party(row.toAccount),
        initiatedBy: row.initiatedBy?.fullName ?? null,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}