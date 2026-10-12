// apps\web\app\(customer)\dashboard\page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AccountCard } from "@/components/accounts/account-card";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { OpenAccountForm } from "@/components/accounts/open-account-form";
import { useAuth } from "@/components/auth-provider";
import { LoanProgress } from "@/components/loans/loan-card";
import { TransactionList } from "@/components/transactions/transaction-list";
import { api } from "@/lib/api";
import { formatDate, formatTnd } from "@/lib/format";
import { sumMoney } from "@/lib/money";
import { useAccounts, useCashflow, useMyLoans, useRecent } from "@/lib/queries";

interface Me {
  createdAt: string;
  profile: { monthlyIncome: string } | null;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const accounts = useAccounts();
  const recent = useRecent(8);
  const loans = useMyLoans();
  const cashflow = useCashflow(6);
  const activeLoans = loans.data?.filter((loan) => loan.status === "APPROVED") ?? [];
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/users/me") });

  const open = accounts.data?.filter((account) => account.status !== "CLOSED") ?? [];
  const total = sumMoney(open.map((account) => account.balance));

  return (
    <div className="space-y-12">
      <header className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="num text-xs tracking-[0.25em] text-accent uppercase">Overview</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {greeting()}, {user?.fullName.split(" ")[0]}.
          </h1>
        </div>
        <div className="sm:text-right">
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">Total balance</p>
          <p className="num text-4xl font-semibold">{accounts.data ? formatTnd(total) : "..."}</p>
        </div>
      </header>

      <section aria-label="Accounts" className="grid gap-5 sm:grid-cols-2">
        {accounts.data?.map((account) => <AccountCard key={account.id} account={account} />)}
        <OpenAccountForm />
      </section>

      {activeLoans.length > 0 && (
        <section aria-label="Active loans">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold">Active loans</h2>
            <Link href="/loans" className="text-sm font-semibold text-brand underline underline-offset-4">
              All loans
            </Link>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {activeLoans.map((loan) => (
              <Link
                key={loan.id}
                href={`/loans/${loan.id}`}
                className="block rounded-xl border-2 border-ink bg-card p-5 transition-colors hover:bg-paper-2/60"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-lg font-semibold">{loan.product.name}</p>
                  <p className="num text-sm text-ink-soft">{formatTnd(loan.amount)}</p>
                </div>
                {loan.nextInstallment && (
                  <p className="num mt-2 text-sm">
                    Next {formatTnd(loan.nextInstallment.amount)} on {formatDate(loan.nextInstallment.dueDate)}
                  </p>
                )}
                <div className="mt-4">
                  <LoanProgress paid={loan.paidInstallments} total={loan.durationMonths} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Cash flow">
        <h2 className="font-display text-2xl font-semibold">Money in and out</h2>
        <p className="mt-1 text-sm text-ink-soft">Last six months. Moves between your own accounts are not counted.</p>
        <div className="mt-4 rounded-xl border-2 border-ink bg-card p-5">
          {cashflow.isLoading ? (
            <p className="py-16 text-center text-ink-soft">Loading...</p>
          ) : cashflow.data ? (
            <CashflowChart data={cashflow.data} />
          ) : null}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Recent activity</h2>
          <Link href="/transfers" className="text-sm font-semibold text-brand underline underline-offset-4">
            New transfer
          </Link>
        </div>
        <div className="mt-4 rounded-xl border-2 border-ink bg-card px-5">
          {recent.isLoading ? (
            <p className="py-10 text-center text-ink-soft">Loading...</p>
          ) : recent.data && recent.data.length > 0 ? (
            <TransactionList items={recent.data} linkToAccount />
          ) : (
            <p className="py-10 text-center text-ink-soft">
              Nothing yet. Open an account and make a deposit from its page.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <article className="rounded-xl border border-rule bg-card p-5">
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">Declared monthly income</p>
          <p className="num mt-2 text-xl font-semibold">
            {me.data?.profile ? formatTnd(me.data.profile.monthlyIncome) : me.isLoading ? "..." : "Not set"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">Used for the debt-ratio check on loan applications.</p>
        </article>
        <article className="rounded-xl border border-rule bg-card p-5">
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">Customer since</p>
          <p className="num mt-2 text-xl font-semibold">{me.data ? formatDate(me.data.createdAt) : "..."}</p>
          <p className="num mt-1 truncate text-sm text-ink-soft">{user?.email}</p>
        </article>
      </section>
    </div>
  );
}