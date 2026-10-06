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
        "group block rounded-xl border-2 border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--ink)] transition-all",
        "hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--ink)]",
        inactive && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">
            {account.type === "CURRENT" ? "Current account" : "Savings account"}
          </p>
          <p className="font-display mt-1 text-lg font-semibold">{account.label ?? "Untitled account"}</p>
        </div>
        {inactive && (
          <span className="num rounded border border-negative px-2 py-0.5 text-[10px] tracking-wider text-negative uppercase">
            {account.status}
          </span>
        )}
      </div>

      <p className="num mt-6 text-3xl font-semibold">{formatTnd(account.balance)}</p>

      <div className="mt-5 border-t-2 border-dashed border-rule pt-3">
        <p className="num text-xs tracking-wide text-ink-soft">{formatIban(account.iban)}</p>
      </div>
    </Link>
  );
}