"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AccountCard } from "@/components/accounts/account-card";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { OpenAccountForm } from "@/components/accounts/open-account-form";
import { useAuth } from "@/components/auth-provider";
import { LoanProgress } from "@/components/loans/loan-card";
import { SectionHeading, sectionLinkClass } from "@/components/ui/section-heading";
import { Guilloche } from "@/components/ui/guilloche";
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

  // The soonest instalment across all active loans.
  const nextDue = activeLoans
    .flatMap((loan) => (loan.nextInstallment ? [loan.nextInstallment] : []))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <h1 className="font-display condensed text-5xl leading-[0.92] text-ink sm:text-7xl">
          {greeting()}, {user?.fullName.split(" ")[0]}.
        </h1>

        <section aria-label="Total balance" className="relative isolate overflow-hidden bg-brand p-8 text-brand-ink sm:p-12">
          <Guilloche className="absolute -top-44 -right-44 -z-10 size-[36rem] text-brand-ink/14" />
          <p className="text-base font-medium opacity-85">Total balance</p>
          <p className="font-display condensed mt-3 text-[clamp(4rem,11vw,8.5rem)] leading-[0.9]">
            {accounts.data ? formatTnd(total).replace(" TND", "") : "..."}
            {accounts.data && <span className="ml-3 text-[0.28em] font-semibold opacity-80">TND</span>}
          </p>

          <dl className="mt-10 grid gap-6 border-t border-brand-ink/30 pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm opacity-75">Open accounts</dt>
              <dd className="font-display mt-1 text-3xl">{accounts.data ? open.length : "..."}</dd>
            </div>
            <div>
              <dt className="text-sm opacity-75">Active loans</dt>
              <dd className="font-display mt-1 text-3xl">{loans.data ? activeLoans.length : "..."}</dd>
            </div>
            <div>
              <dt className="text-sm opacity-75">Next instalment</dt>
              <dd className="font-display mt-1 text-3xl">
                {nextDue ? formatTnd(nextDue.amount) : loans.data ? "None due" : "..."}
              </dd>
              {nextDue && <p className="mt-0.5 text-sm opacity-75">on {formatDate(nextDue.dueDate)}</p>}
            </div>
          </dl>
        </section>
      </div>

      <section aria-label="Accounts" className="grid gap-5 sm:grid-cols-2">
        {accounts.data?.map((account) => <AccountCard key={account.id} account={account} />)}
        <OpenAccountForm />
      </section>

      {activeLoans.length > 0 && (
        <section aria-label="Active loans" className="space-y-5">
          <SectionHeading
            action={
              <Link href="/loans" className={sectionLinkClass}>
                All loans
              </Link>
            }
          >
            Active loans
          </SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2">
            {activeLoans.map((loan) => (
              <Link
                key={loan.id}
                href={`/loans/${loan.id}`}
                className="group block border border-ink/20 bg-card p-6 transition-colors hover:border-ink"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-2xl group-hover:text-brand">{loan.product.name}</p>
                  <p className="num text-sm text-ink-soft">{formatTnd(loan.amount)}</p>
                </div>
                {loan.nextInstallment && (
                  <p className="num mt-3 text-sm">
                    Next {formatTnd(loan.nextInstallment.amount)} on {formatDate(loan.nextInstallment.dueDate)}
                  </p>
                )}
                <div className="mt-5">
                  <LoanProgress paid={loan.paidInstallments} total={loan.durationMonths} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Cash flow" className="space-y-5">
        <SectionHeading hint="Last six months. Moves between your own accounts are not counted.">
          Money in and out
        </SectionHeading>
        <div className="border border-ink/20 bg-card p-5 sm:p-6">
          {cashflow.isLoading ? (
            <p className="py-16 text-center text-ink-soft">Loading...</p>
          ) : cashflow.data ? (
            <CashflowChart data={cashflow.data} />
          ) : null}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          action={
            <Link href="/transfers" className={sectionLinkClass}>
              New transfer
            </Link>
          }
        >
          Recent activity
        </SectionHeading>
        <div className="border border-ink/20 bg-card px-5">
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

      <section>
        <dl className="grid divide-y divide-ink/15 border-y-2 border-ink sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="py-6 sm:pr-8">
            <dt className="text-sm text-ink-soft">Declared monthly income</dt>
            <dd className="font-display mt-1.5 text-3xl">
              {me.data?.profile ? formatTnd(me.data.profile.monthlyIncome) : me.isLoading ? "..." : "Not set"}
            </dd>
            <p className="mt-1.5 text-sm text-ink-soft">Used for the debt-ratio check on loan applications.</p>
          </div>
          <div className="py-6 sm:pl-8">
            <dt className="text-sm text-ink-soft">Customer since</dt>
            <dd className="font-display mt-1.5 text-3xl">{me.data ? formatDate(me.data.createdAt) : "..."}</dd>
            <p className="num mt-1.5 truncate text-sm text-ink-soft">{user?.email}</p>
          </div>
        </dl>
      </section>
    </div>
  );
}
