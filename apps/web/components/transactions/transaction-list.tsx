import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatTnd } from "@/lib/format";
import type { RecentTransaction, TransactionType, TransactionView } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Record<TransactionType, string> = {
  DEPOSIT: "Cash deposit",
  WITHDRAWAL: "Cash withdrawal",
  TRANSFER: "Transfer",
  LOAN_DISBURSEMENT: "Loan disbursement",
  LOAN_REPAYMENT: "Loan repayment",
};

export const TYPE_LABELS = LABELS;

function Row({ tx, href }: { tx: TransactionView | RecentTransaction; href?: string }) {
  const incoming = tx.direction === "IN";
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  const party = tx.counterparty
    ? `${incoming ? "from" : "to"} ${tx.counterparty.name}`
    : null;

  const content = (
    <div className="flex items-center gap-4 py-4">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border-2",
          incoming ? "border-positive text-positive" : "border-ink text-ink",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{tx.description ?? LABELS[tx.type]}</p>
        <p className="truncate text-sm text-ink-soft">
          {LABELS[tx.type]}
          {party && ` · ${party}`} · {formatDateTime(tx.createdAt)}
        </p>
      </div>

      <div className="text-right">
        <p className={cn("num font-semibold", incoming ? "text-positive" : "text-ink")}>
          {incoming ? "+" : "-"} {formatTnd(tx.amount)}
        </p>
        {tx.balanceAfter && <p className="num text-xs text-ink-soft">balance {formatTnd(tx.balanceAfter)}</p>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block transition-colors hover:bg-paper-2/60">
      {content}
    </Link>
  ) : (
    content
  );
}

export function TransactionList({
  items,
  linkToAccount = false,
}: {
  items: (TransactionView | RecentTransaction)[];
  linkToAccount?: boolean;
}) {
  return (
    <ul className="divide-y divide-rule">
      {items.map((tx) => (
        <li key={tx.id}>
          <Row tx={tx} href={linkToAccount && "accountId" in tx ? `/accounts/${tx.accountId}` : undefined} />
        </li>
      ))}
    </ul>
  );
}