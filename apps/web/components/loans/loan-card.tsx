import Link from "next/link";
import { formatDate, formatTnd } from "@/lib/format";
import type { LoanSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export function LoanProgress({ paid, total }: { paid: number; total: number }) {
  return (
    <div>
      <div className="h-2.5 overflow-hidden rounded-full border border-ink" role="progressbar" aria-valuenow={paid} aria-valuemin={0} aria-valuemax={total}>
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
        "block rounded-xl border-2 border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--ink)] transition-all",
        "hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--ink)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl font-semibold">{loan.product.name}</h3>
            <StatusBadge status={loan.status} />
          </div>
          <p className="num mt-1 text-sm text-ink-soft">
            Applied {formatDate(loan.createdAt)} · {loan.durationMonths} months at {Number(loan.interestRate).toFixed(2)} %
          </p>
        </div>
        <p className="num text-3xl font-semibold">{formatTnd(loan.amount)}</p>
      </div>

      <div className="mt-5 grid gap-5 border-t-2 border-dashed border-rule pt-4 sm:grid-cols-2">
        <div>
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">Monthly payment</p>
          <p className="num mt-1 text-lg font-semibold">{formatTnd(loan.monthlyPayment)}</p>
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
          <p className="text-sm text-negative">{loan.rejectionReason}</p>
        ) : loan.status === "PENDING" ? (
          <p className="text-sm text-ink-soft">Waiting for a decision from the bank.</p>
        ) : (
          <p className="text-sm text-ink-soft">Fully repaid. Thank you.</p>
        )}
      </div>
    </Link>
  );
}