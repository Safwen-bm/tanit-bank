import type { LoanStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE: Record<LoanStatus, { label: string; dot: string }> = {
  PENDING: { label: "In review", dot: "bg-gold" },
  APPROVED: { label: "Active", dot: "bg-positive" },
  REJECTED: { label: "Declined", dot: "bg-negative" },
  PAID_OFF: { label: "Paid off", dot: "bg-ink-soft" },
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  const { label, dot } = STYLE[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
      <span className={cn("size-2.5", dot)} aria-hidden="true" />
      {label}
    </span>
  );
}
