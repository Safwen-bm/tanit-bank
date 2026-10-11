"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoanProgress } from "@/components/loans/loan-card";
import { LoanSchedule } from "@/components/loans/loan-schedule";
import { StatusBadge } from "@/components/loans/status-badge";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatIban, formatTnd } from "@/lib/format";
import { useAccounts, useLoan } from "@/lib/queries";
import type { LoanDetail } from "@/lib/types";

function RepayPanel({ loan }: { loan: LoanDetail }) {
  const queryClient = useQueryClient();
  const accounts = useAccounts();
  const [chosen, setChosen] = useState<string | null>(null);
  const next = loan.nextInstallment;
  const options = accounts.data?.filter((account) => account.status === "ACTIVE") ?? [];
  // Default to the account that received the loan, unless it can no longer be used.
  const accountId = options.find((account) => account.id === (chosen ?? loan.account.id))?.id ?? options[0]?.id ?? "";

  const pay = useMutation({
    mutationFn: () => api<LoanDetail>(`/loans/${loan.id}/repay`, { method: "POST", body: { accountId } }),
    onSuccess: (updated) => {
      toast.success(updated.status === "PAID_OFF" ? "Loan fully repaid" : "Instalment paid");
      void queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
      void queryClient.invalidateQueries();
    },
  });

  if (!next) return null;
  return (
    <section className="rounded-xl border-2 border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--ink)]">
      <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">Next instalment</p>
      <p className="num mt-1 text-3xl font-semibold">{formatTnd(next.amount)}</p>
      <p className="num text-sm text-ink-soft">
        #{next.number} · due {formatDate(next.dueDate)}
      </p>
      <label htmlFor="pay-from" className="num mt-5 block text-[11px] tracking-[0.18em] text-ink-soft uppercase">
        Pay from
      </label>
      <select id="pay-from" value={accountId} onChange={(event) => setChosen(event.target.value)} className={inputClass}>
        {options.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label ?? account.type} · {formatTnd(account.balance)}
          </option>
        ))}
      </select>
      <Button className="mt-5 w-full" loading={pay.isPending} disabled={!accountId} onClick={() => pay.mutate()}>
        Pay this instalment
      </Button>
    </section>
  );
}

export default function LoanPage() {
  const { id } = useParams<{ id: string }>();
  const query = useLoan(id);

  if (query.isLoading) return <p className="text-ink-soft">Loading...</p>;
  if (query.error || !query.data) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="rounded-xl border-2 border-dashed border-rule p-10 text-center">
        <p className="font-display text-xl">{missing ? "Loan not found." : "Something went wrong."}</p>
        <Link href="/loans" className="mt-3 inline-block text-sm font-semibold text-brand underline underline-offset-4">
          Back to loans
        </Link>
      </div>
    );
  }

  const loan = query.data;

  return (
    <div className="space-y-10">
      <Link href="/loans" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Loans
      </Link>

      <header className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <p className="num text-xs tracking-[0.25em] text-accent uppercase">{loan.product.name}</p>
            <StatusBadge status={loan.status} />
          </div>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatTnd(loan.amount)}
          </h1>
          <p className="num mt-2 text-sm text-ink-soft">
            {loan.durationMonths} months at {Number(loan.interestRate).toFixed(2)} % · {formatTnd(loan.monthlyPayment)} a month
          </p>
        </div>
        <div className="sm:text-right">
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">Total to repay</p>
          <p className="num text-2xl font-semibold">{formatTnd(loan.totalPayment)}</p>
          <p className="num text-sm text-ink-soft">of which interest {formatTnd(loan.totalInterest)}</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-8">
          {loan.status === "PENDING" && (
            <div className="flex gap-4 rounded-xl border-2 border-gold p-5">
              <Clock className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <p className="font-semibold">Waiting for a decision</p>
                <p className="mt-1 text-sm text-ink-soft">
                  The bank is reviewing your application, in the order received.
                  {loan.flagged && " Your repayments exceed this product's debt ratio, so it will get a closer look."}
                </p>
              </div>
            </div>
          )}
          {loan.status === "REJECTED" && (
            <div className="flex gap-4 rounded-xl border-2 border-negative p-5">
              <XCircle className="mt-0.5 size-6 shrink-0 text-negative" aria-hidden="true" />
              <div>
                <p className="font-semibold">Application declined</p>
                <p className="mt-1 text-sm">{loan.rejectionReason}</p>
              </div>
            </div>
          )}
          {(loan.status === "APPROVED" || loan.status === "PAID_OFF") && (
            <div className="flex gap-4 rounded-xl border-2 border-positive p-5">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-positive" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold">
                  {loan.status === "PAID_OFF" ? "Fully repaid" : "Approved and paid out"}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {formatTnd(loan.amount)} reached {loan.account.label ?? "your account"} (
                  <span className="num">{formatIban(loan.account.iban)}</span>)
                  {loan.disbursedAt && ` on ${formatDate(loan.disbursedAt)}`}.
                </p>
                <div className="mt-4 max-w-sm">
                  <LoanProgress paid={loan.paidInstallments} total={loan.durationMonths} />
                </div>
              </div>
            </div>
          )}

          {loan.purpose && (
            <p className="text-sm">
              <span className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">Purpose </span>
              {loan.purpose}
            </p>
          )}

          {loan.schedule.length > 0 && (
            <div>
              <h2 className="font-display mb-3 text-2xl font-semibold">
                {loan.status === "PENDING" ? "Repayment preview" : "Repayment schedule"}
              </h2>
              <LoanSchedule schedule={loan.schedule} />
            </div>
          )}
        </div>

        {loan.status === "APPROVED" && <RepayPanel key={loan.paidInstallments} loan={loan} />}
      </div>
    </div>
  );
}