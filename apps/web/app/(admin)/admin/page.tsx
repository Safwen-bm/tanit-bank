// apps\web\app\(admin)\admin\page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { StatTile } from "@/components/admin/stat-tile";
import { useAuth } from "@/components/auth-provider";
import { ActivityChart } from "@/components/charts/activity-chart";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/format";
import { useAdminStats } from "@/lib/queries";

interface LedgerCheck {
  balanced: boolean;
  total: string;
  treasury: string;
  customers: string;
  accounts: number;
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const stats = useAdminStats();
  const ledger = useQuery({ queryKey: ["ledger-check"], queryFn: () => api<LedgerCheck>("/admin/ledger-check") });
  const data = stats.data;

  return (
    <div className="space-y-10">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Back office</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Welcome, {user?.fullName.split(" ")[0]}.
        </h1>
      </header>

      {data && data.pendingLoans > 0 && (
        <Link
          href="/admin/loan-applications"
          className="flex items-center justify-between gap-4 rounded-xl border-2 border-gold p-5 transition-colors hover:bg-paper-2/60"
        >
          <p className="font-semibold">
            {data.pendingLoans} loan application{data.pendingLoans > 1 ? "s" : ""} waiting for review
          </p>
          <span className="text-sm font-semibold text-brand underline underline-offset-4">Open the queue</span>
        </Link>
      )}

      <section aria-label="Key figures" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Customers"
          value={data?.customers ?? "..."}
          note={data ? `${data.newCustomers30d} joined in the last 30 days` : undefined}
        />
        <StatTile label="Open accounts" value={data?.openAccounts ?? "..."} />
        <StatTile label="Customer deposits" value={data ? formatTnd(data.totalDeposits) : "..."} />
        <StatTile label="Active loans" value={data?.activeLoans ?? "..."} />
        <StatTile
          label="Still to be repaid"
          value={data ? formatTnd(data.outstandingPrincipal) : "..."}
          note="Principal of unpaid instalments"
        />
        <StatTile
          label="Transfers, 30 days"
          value={data ? data.transfers30d.count : "..."}
          note={data ? `${formatTnd(data.transfers30d.volume)} moved` : undefined}
        />
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Money moved, last 14 days</h2>
        <div className="mt-4 rounded-xl border-2 border-ink bg-card p-5">
          {data ? <ActivityChart series={data.series} /> : <p className="py-16 text-center text-ink-soft">Loading...</p>}
        </div>
      </section>

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
    </div>
  );
}