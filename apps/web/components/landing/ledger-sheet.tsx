const ENTRIES: [string, string, "in" | "out"][] = [
  ["Salary, October", "2 500.000", "in"],
  ["Rent", "800.000", "out"],
  ["Groceries", "142.350", "out"],
  ["Transfer from Amel", "60.000", "in"],
  ["Loan repayment", "412.116", "out"],
];

/** Decorative: an illustrative ledger page with a SETTLED stamp. Numbers are made up. */
export function LedgerSheet() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="ledger relative -rotate-2 rounded-lg border-2 border-ink bg-card p-7 shadow-[8px_8px_0_0_var(--ink)]">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <p className="font-display text-lg font-semibold">Ledger</p>
          <p className="num text-[11px] tracking-[0.2em] text-ink-soft uppercase">Oct 2026</p>
        </div>

        <ul className="mt-4 space-y-3 text-sm">
          {ENTRIES.map(([label, amount, direction]) => (
            <li key={label} className="flex items-baseline gap-2">
              <span>{label}</span>
              <span className="flex-1 border-b border-dotted border-ink-soft/60" />
              <span className={`num ${direction === "in" ? "text-positive" : ""}`}>
                {direction === "in" ? "+" : "-"} {amount}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t-4 border-double border-ink pt-3">
          <div className="flex items-baseline justify-between">
            <span className="num text-[11px] tracking-[0.2em] text-ink-soft uppercase">Balance</span>
            <span className="num text-2xl font-semibold">1 205.534 TND</span>
          </div>
        </div>
      </div>

      <div className="font-display absolute -right-2 -bottom-5 rotate-12 rounded-md border-4 border-accent px-4 py-1 text-2xl font-bold tracking-[0.2em] text-accent uppercase opacity-90">
        Settled
      </div>
    </div>
  );
}