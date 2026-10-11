import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../transactions/ledger.service";
import { addMonthsUtc } from "./dates";
import { AdminApplicationsQueryDto, ApproveLoanDto, RejectLoanDto } from "./dto/loan-application.dto";
import { computeLoan } from "./loan-calculator";
import { DETAIL_INCLUDE, SUMMARY_INCLUDE, toLoanDetail, toLoanSummary } from "./loan-views";

const WITH_CUSTOMER = {
  ...SUMMARY_INCLUDE,
  user: {
    select: { id: true, fullName: true, email: true, profile: { select: { monthlyIncome: true } } },
  },
} satisfies Prisma.LoanInclude;

@Injectable()
export class LoanReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async list(query: AdminApplicationsQueryDto) {
    const status = query.status ?? "PENDING";
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.LoanWhereInput = status === "ALL" ? {} : { status };

    const [total, rows, grouped] = await Promise.all([
      this.prisma.loan.count({ where }),
      this.prisma.loan.findMany({
        where,
        include: WITH_CUSTOMER,
        // Oldest first for the queue, newest first for history.
        orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.loan.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, PAID_OFF: 0 };
    for (const row of grouped) counts[row.status] = row._count._all;

    return {
      items: rows.map((row) => ({
        ...toLoanSummary(row),
        customer: {
          id: row.user.id,
          fullName: row.user.fullName,
          email: row.user.email,
          monthlyIncome: row.user.profile?.monthlyIncome.toFixed(3) ?? null,
        },
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      counts,
    };
  }

  async get(id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: { ...DETAIL_INCLUDE, user: WITH_CUSTOMER.user },
    });
    if (!loan) throw new NotFoundException("Application not found");

    const others = await this.prisma.loan.aggregate({
      _sum: { monthlyPayment: true },
      where: { userId: loan.user.id, status: "APPROVED", id: { not: id } },
    });

    return {
      ...toLoanDetail(loan),
      customer: {
        id: loan.user.id,
        fullName: loan.user.fullName,
        email: loan.user.email,
        monthlyIncome: loan.user.profile?.monthlyIncome.toFixed(3) ?? null,
        otherCommitments: (others._sum.monthlyPayment ?? new Prisma.Decimal(0)).toFixed(3),
      },
    };
  }

  /**
   * One transaction: status, disbursement through the ledger (LOAN_DISBURSEMENT + customer
   * notification + audit), the repayment schedule and the approval audit entry.
   */
  async approve(adminId: string, id: string, dto: ApproveLoanDto, ip?: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id }, include: { product: true } });
    if (!loan) throw new NotFoundException("Application not found");
    if (loan.status !== "PENDING") throw new ConflictException("This application was already reviewed");
    if (loan.flagged && !dto.overrideDebtRatio) {
      throw new UnprocessableEntityException(
        "This application exceeds the debt ratio limit. Confirm the override to approve it anyway.",
      );
    }

    const treasuryId = await this.ledger.getTreasuryId();
    const quote = computeLoan(loan.amount.toFixed(3), loan.interestRate.toFixed(4), loan.durationMonths);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.loan.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", reviewedAt: now, reviewedById: adminId, disbursedAt: now },
      });
      if (claimed.count !== 1) throw new ConflictException("This application was already reviewed");

      await this.ledger.apply(tx, {
        type: "LOAN_DISBURSEMENT",
        amount: loan.amount,
        fromAccountId: treasuryId,
        toAccountId: loan.accountId,
        description: `${loan.product.name} disbursement`,
        initiatedById: adminId,
        idempotencyKey: `loan-disbursement-${id}`,
        audit: { action: "LOAN_DISBURSEMENT", ip },
        notifyRecipient: {
          userId: loan.userId,
          title: "Loan approved",
          body: `Your ${loan.product.name} of ${loan.amount.toFixed(3)} TND was approved and paid into your account.`,
          link: `/loans/${id}`,
        },
      });

      await tx.loanInstallment.createMany({
        data: quote.schedule.map((row) => ({
          loanId: id,
          number: row.number,
          dueDate: addMonthsUtc(now, row.number),
          principal: row.principal,
          interest: row.interest,
          total: row.payment,
          remainingBalance: row.remaining,
        })),
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "LOAN_APPROVE",
          entity: "Loan",
          entityId: id,
          metadata: {
            amount: loan.amount.toFixed(3),
            customerId: loan.userId,
            flagged: loan.flagged,
            debtRatioOverride: loan.flagged && !!dto.overrideDebtRatio,
          },
          ip,
        },
      });
    });

    return this.get(id);
  }

  async reject(adminId: string, id: string, dto: RejectLoanDto, ip?: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id }, include: { product: true } });
    if (!loan) throw new NotFoundException("Application not found");
    if (loan.status !== "PENDING") throw new ConflictException("This application was already reviewed");

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.loan.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "REJECTED",
          rejectionReason: dto.reason.trim(),
          reviewedAt: new Date(),
          reviewedById: adminId,
        },
      });
      if (claimed.count !== 1) throw new ConflictException("This application was already reviewed");

      await tx.notification.create({
        data: {
          userId: loan.userId,
          title: "Loan application declined",
          body: `Your ${loan.product.name} application of ${loan.amount.toFixed(3)} TND was declined: ${dto.reason.trim()}`,
          link: `/loans/${id}`,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "LOAN_REJECT",
          entity: "Loan",
          entityId: id,
          metadata: { reason: dto.reason.trim(), customerId: loan.userId },
          ip,
        },
      });
    });

    return this.get(id);
  }
}