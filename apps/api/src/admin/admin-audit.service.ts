import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditQueryDto } from "./dto/admin.dto";

/** Read-only on purpose: nothing in the API can edit or delete an audit entry. */
@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const filters: Prisma.AuditLogWhereInput[] = [];
    if (query.action) filters.push({ action: query.action });
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
      filters.push({
        OR: [
          { user: { fullName: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { entityId: { contains: q } },
          { ip: { contains: q } },
        ],
      });
    }
    const where: Prisma.AuditLogWhereInput = filters.length > 0 ? { AND: filters } : {};

    const [total, rows, actions] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        metadata: row.metadata,
        ip: row.ip,
        actor: row.user,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      actions: actions.map((a) => a.action),
    };
  }
}