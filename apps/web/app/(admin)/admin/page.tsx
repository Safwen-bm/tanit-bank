"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/format";

interface LedgerCheck {
  balanced: boolean;
  total: string;
  treasury: string;
  customers: string;
  accounts: number;
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const ledger = useQuery({ queryKey: ["ledger-check"], queryFn: () => api<LedgerCheck>("/admin/ledger-check") });

  return (
    <div className="space-y-10">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Back office</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Welcome, {user?.fullName.split(" ")[0]}.
        </h1>
      </header>

      <section className="rounded-xl border-2 border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--ink)]">
        <div className="flex items-center gap-3">
          {ledger.data?.balanced ? (
            <CheckCircle2 className="size-6 text-positive" aria-hidden="true" />
          ) : (
            <TriangleAlert className="size-6 text-negative" aria-hidden="true" />
          )}
          <h2 className="font-display text-xl font-semibold">
            Ledger check: {ledger.isLoading ? "..." : ledger.data?.balanced ? "balanced" : "NOT balanced"}
          </h2>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Every movement debits one account and credits another, so all balances together must sum to exactly zero.
        </p>
        {ledger.data && (
          <dl className="num mt-5 grid gap-4 border-t-2 border-dashed border-rule pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-soft">Customer deposits</dt>
              <dd className="mt-1 text-lg font-semibold">{formatTnd(ledger.data.customers)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Treasury</dt>
              <dd className="mt-1 text-lg font-semibold">{formatTnd(ledger.data.treasury)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Sum of all {ledger.data.accounts} accounts</dt>
              <dd className="mt-1 text-lg font-semibold">{formatTnd(ledger.data.total)}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-xl border-2 border-dashed border-rule p-8 text-center">
        <p className="font-display text-xl">Bank statistics, customers and loan reviews arrive with the next phases.</p>
        <p className="mt-2 text-sm text-ink-soft">You are signed in with the ADMIN role.</p>
      </section>
    </div>
  );
}