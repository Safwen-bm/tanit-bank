import { Prisma } from "../generated/prisma/client";
import { isoDate } from "./dates";
import { computeLoan } from "./loan-calculator";

export const SUMMARY_INCLUDE = {
  product: { select: { id: true, name: true } },
  account: { select: { id: true, iban: true, label: true } },
  installments: {
    select: { number: true, status: true, dueDate: true, total: true },
    orderBy: { number: "asc" },
  },
} satisfies Prisma.LoanInclude;

export const DETAIL_INCLUDE = {
  product: { select: { id: true, name: true } },
  account: { select: { id: true, iban: true, label: true } },
  installments: { orderBy: { number: "asc" } },
} satisfies Prisma.LoanInclude;

export type LoanSummaryRow = Prisma.LoanGetPayload<{ include: typeof SUMMARY_INCLUDE }>;
export type LoanDetailRow = Prisma.LoanGetPayload<{ include: typeof DETAIL_INCLUDE }>;

export function toLoanSummary(loan: LoanSummaryRow) {
  const paid = loan.installments.filter((i) => i.status === "PAID").length;
  const next = loan.installments.find((i) => i.status === "UNPAID");
  return {
    id: loan.id,
    status: loan.status,
    amount: loan.amount.toFixed(3),
    durationMonths: loan.durationMonths,
    interestRate: loan.interestRate.toFixed(4),
    monthlyPayment: loan.monthlyPayment.toFixed(3),
    totalPayment: loan.totalPayment.toFixed(3),
    totalInterest: loan.totalInterest.toFixed(3),
    debtRatio: loan.debtRatio.toFixed(4),
    flagged: loan.flagged,
    purpose: loan.purpose,
    rejectionReason: loan.rejectionReason,
    createdAt: loan.createdAt,
    reviewedAt: loan.reviewedAt,
    disbursedAt: loan.disbursedAt,
    product: loan.product,
    account: loan.account,
    paidInstallments: paid,
    nextInstallment: next
      ? { number: next.number, dueDate: isoDate(next.dueDate), amount: next.total.toFixed(3) }
      : null,
  };
}

/** Approved loans show their real installments; pending ones show a preview of the same maths. */
export function toLoanDetail(loan: LoanDetailRow) {
  const schedule =
    loan.installments.length > 0
      ? loan.installments.map((i) => ({
          number: i.number,
          dueDate: isoDate(i.dueDate),
          payment: i.total.toFixed(3),
          principal: i.principal.toFixed(3),
          interest: i.interest.toFixed(3),
          remaining: i.remainingBalance.toFixed(3),
          status: i.status,
          paidAt: i.paidAt,
        }))
      : loan.status === "PENDING"
        ? computeLoan(loan.amount.toFixed(3), loan.interestRate.toFixed(4), loan.durationMonths).schedule.map((row) => ({
            ...row,
            dueDate: null,
            status: null,
            paidAt: null,
          }))
        : [];

  return {
    ...toLoanSummary({
      ...loan,
      installments: loan.installments.map((i) => ({
        number: i.number,
        status: i.status,
        dueDate: i.dueDate,
        total: i.total,
      })),
    }),
    schedule,
  };
}