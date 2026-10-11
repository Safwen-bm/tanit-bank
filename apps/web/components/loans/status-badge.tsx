import type { LoanStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE: Record<LoanStatus, { label: string; className: string }> = {
  PENDING: { label: "In review", className: "border-gold text-gold" },
  APPROVED: { label: "Active", className: "border-positive text-positive" },
  REJECTED: { label: "Declined", className: "border-negative text-negative" },
  PAID_OFF: { label: "Paid off", className: "border-ink-soft text-ink-soft" },
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  const { label, className } = STYLE[status];
  return (
    <span className={cn("num rounded border px-2 py-0.5 text-[10px] tracking-wider uppercase", className)}>{label}</span>
  );
}