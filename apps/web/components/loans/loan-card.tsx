import Link from "next/link";
import { formatDate, formatTnd } from "@/lib/format";
import type { LoanStatus, LoanSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

const EDGE: Record<LoanStatus, string> = {
  PENDING: "border-l-gold",
  APPROVED: "border-l-brand",
  REJECTED: "border-l-negative",
  PAID_OFF: "border-l-ink-soft",
};

export function LoanProgress({ paid, total }: { paid: number; total: number }) {
  return (
    <div>
      <div className="h-3 bg-ink/10" role="progressbar" aria-valuenow={paid} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full bg-brand" style={{ width: `${(paid / total) * 100}%` }} />
      </div>
      <p className="num mt-1.5 text-xs text-ink-soft">
        {paid} of {total} instalments paid
      </p>
    </div>
  );
}

export function LoanCard({ loan }: { loan: LoanSummary }) {
  return (
    <Link
      href={`/loans/${loan.id}`}
      className={cn(
        "group block border border-l-4 border-ink/20 bg-card p-6 transition-colors hover:border-ink",
        EDGE[loan.status],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h3 className="font-display text-2xl group-hover:text-brand">{loan.product.name}</h3>
            <StatusBadge status={loan.status} />
          </div>
          <p className="num mt-1.5 text-sm text-ink-soft">
            Applied {formatDate(loan.createdAt)} · {loan.durationMonths} months at {Number(loan.interestRate).toFixed(2)} %
          </p>
        </div>
        <p className="font-display condensed text-5xl leading-none">{formatTnd(loan.amount)}</p>
      </div>

      <div className="mt-6 grid gap-5 border-t border-ink/15 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-ink-soft">Monthly payment</p>
          <p className="font-display mt-1 text-2xl">{formatTnd(loan.monthlyPayment)}</p>
        </div>
        {loan.status === "APPROVED" ? (
          <div>
            <LoanProgress paid={loan.paidInstallments} total={loan.durationMonths} />
            {loan.nextInstallment && (
              <p className="num mt-1 text-xs text-ink-soft">
                Next: {formatTnd(loan.nextInstallment.amount)} on {formatDate(loan.nextInstallment.dueDate)}
              </p>
            )}
          </div>
        ) : loan.status === "REJECTED" ? (
          <p className="text-sm font-medium text-negative">{loan.rejectionReason}</p>
        ) : loan.status === "PENDING" ? (
          <p className="text-sm text-ink-soft">Waiting for a decision from the bank.</p>
        ) : (
          <p className="text-sm text-ink-soft">Fully repaid. Thank you.</p>
        )}
      </div>
    </Link>
  );
}
