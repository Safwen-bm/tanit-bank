import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../transactions/ledger.service";
import { ApplyLoanDto, RepayDto } from "./dto/loan-application.dto";
import { computeLoan, UnschedulableLoanError } from "./loan-calculator";
import { assertWithinProduct } from "./loan-rules";
import { DETAIL_INCLUDE, SUMMARY_INCLUDE, toLoanDetail, toLoanSummary } from "./loan-views";

const MAX_PENDING = 3;
const MAX_RATIO = new Prisma.Decimal("99.9999");

/**
 * Debt ratio = (this loan's payment + the instalments of loans already running) / declared income.
 * Existing commitments count: three small loans must not slip past a per-loan check.
 */
export function debtRatio(payment: Prisma.Decimal, commitments: Prisma.Decimal, income: Prisma.Decimal) {
  if (income.lte(0)) return MAX_RATIO;
  const ratio = payment.plus(commitments).div(income).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  return ratio.gt(MAX_RATIO) ? MAX_RATIO : ratio;
}

@Injectable()
export class LoanApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
    private readonly ledger: LedgerService,
  ) {}

  async apply(userId: string, dto: ApplyLoanDto, ip?: string) {
    const product = await this.prisma.loanProduct.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException("Loan product not available");

    const amount = new Prisma.Decimal(dto.amount);
    assertWithinProduct(product, amount, dto.months);

    const account = await this.accounts.getOwned(userId, dto.accountId);
    if (account.status !== "ACTIVE") {
      throw new UnprocessableEntityException("The receiving account must be active");
    }

    const pending = await this.prisma.loan.count({ where: { userId, status: "PENDING" } });
    if (pending >= MAX_PENDING) {
      throw new UnprocessableEntityException(`You already have ${MAX_PENDING} applications waiting for review`);
    }

    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new UnprocessableEntityException("Declare your monthly income before applying");

    let quote;
    try {
      quote = computeLoan(amount.toFixed(3), product.annualRate.toFixed(4), dto.months);
    } catch (error) {
      if (error instanceof UnschedulableLoanError) throw new UnprocessableEntityException(error.message);
      throw error;
    }

    const running = await this.prisma.loan.aggregate({
      _sum: { monthlyPayment: true },
      where: { userId, status: "APPROVED" },
    });
    const commitments = running._sum.monthlyPayment ?? new Prisma.Decimal(0);
    const ratio = debtRatio(new Prisma.Decimal(quote.monthlyPayment), commitments, profile.monthlyIncome);

    // The product's rate and conditions are copied into the loan. Later admin changes never touch it.
    const loan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.loan.create({
        data: {
          userId,
          accountId: account.id,
          productId: product.id,
          amount,
          durationMonths: dto.months,
          interestRate: product.annualRate,
          monthlyPayment: quote.monthlyPayment,
          totalPayment: quote.totalPayment,
          totalInterest: quote.totalInterest,
          debtRatio: ratio,
          flagged: ratio.gt(product.maxDebtRatio),
          purpose: dto.purpose?.trim() || null,
        },
        include: DETAIL_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "LOAN_APPLY",
          entity: "Loan",
          entityId: created.id,
          metadata: {
            product: product.name,
            amount: amount.toFixed(3),
            months: dto.months,
            debtRatio: ratio.toFixed(4),
            flagged: created.flagged,
          },
          ip,
        },
      });
      return created;
    });
    return toLoanDetail(loan);
  }

  async list(userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { userId },
      include: SUMMARY_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return loans.map(toLoanSummary);
  }

  async get(userId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({ where: { id, userId }, include: DETAIL_INCLUDE });
    if (!loan) throw new NotFoundException("Loan not found");
    return toLoanDetail(loan);
  }

  /** Pays the next unpaid instalment. The instalment's own status is the guard against paying twice. */
  async repay(userId: string, id: string, dto: RepayDto, ip?: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, userId },
      include: { installments: { orderBy: { number: "asc" } } },
    });
    if (!loan) throw new NotFoundException("Loan not found");
    if (loan.status !== "APPROVED") throw new UnprocessableEntityException("This loan has no instalment to pay");

    const next = loan.installments.find((i) => i.status === "UNPAID");
    if (!next) throw new UnprocessableEntityException("This loan has no instalment to pay");

    const account = await this.accounts.getOwned(userId, dto.accountId ?? loan.accountId);
    const treasuryId = await this.ledger.getTreasuryId();

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.loanInstallment.updateMany({
        where: { id: next.id, status: "UNPAID" },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (claimed.count !== 1) throw new ConflictException("This instalment was already paid");

      // If the account cannot cover it, this throws and the claim above is rolled back too.
      await this.ledger.apply(tx, {
        type: "LOAN_REPAYMENT",
        amount: next.total,
        fromAccountId: account.id,
        toAccountId: treasuryId,
        description: `Loan repayment ${next.number}/${loan.durationMonths}`,
        initiatedById: userId,
        audit: { action: "LOAN_REPAY", ip },
      });

      const unpaid = await tx.loanInstallment.count({ where: { loanId: loan.id, status: "UNPAID" } });
      if (unpaid === 0) {
        await tx.loan.update({ where: { id: loan.id }, data: { status: "PAID_OFF" } });
        await tx.notification.create({
          data: {
            userId,
            title: "Loan paid off",
            body: `You have repaid your ${loan.amount.toFixed(3)} TND loan in full.`,
            link: `/loans/${loan.id}`,
          },
        });
      }
    });

    return this.get(userId, id);
  }
}