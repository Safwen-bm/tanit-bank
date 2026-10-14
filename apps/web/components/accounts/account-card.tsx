import Link from "next/link";
import { formatIban, formatTnd } from "@/lib/format";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AccountCard({ account }: { account: Account }) {
  const inactive = account.status !== "ACTIVE";
  return (
    <Link
      href={`/accounts/${account.id}`}
      className={cn(
        "group block border border-l-4 border-ink/20 bg-card p-6 transition-colors hover:border-ink",
        account.type === "CURRENT" ? "border-l-brand" : "border-l-ink",
        inactive && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">{account.type === "CURRENT" ? "Current account" : "Savings account"}</p>
          <p className="font-display mt-1 text-2xl group-hover:text-brand">{account.label ?? "Untitled account"}</p>
        </div>
        {inactive && <span className="text-sm font-semibold text-negative capitalize">{account.status.toLowerCase()}</span>}
      </div>

      <p className="font-display condensed mt-7 text-5xl leading-none">{formatTnd(account.balance)}</p>

      <p className="num mt-6 border-t border-ink/15 pt-3 text-xs tracking-wide text-ink-soft">{formatIban(account.iban)}</p>
    </Link>
  );
}
