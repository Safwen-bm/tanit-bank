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
import { SectionHeading } from "@/components/ui/section-heading";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatIban, formatTnd } from "@/lib/format";
import { useAccounts, useLoan } from "@/lib/queries";
import type { LoanDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    <section className="border-t-8 border-brand bg-deep p-6 text-deep-ink sm:p-8">
      <p className="text-sm text-deep-ink/65">Next instalment</p>
      <p className="font-display condensed mt-1 text-5xl leading-none">{formatTnd(next.amount)}</p>
      <p className="num mt-2 text-sm text-deep-ink/65">
        #{next.number} · due {formatDate(next.dueDate)}
      </p>
      <label htmlFor="pay-from" className="mt-7 mb-2 block text-sm font-semibold">
        Pay from
      </label>
      <select
        id="pay-from"
        value={accountId}
        onChange={(event) => setChosen(event.target.value)}
        className={cn(inputClass, "border-deep-ink/30 bg-deep text-deep-ink hover:border-deep-ink/60 focus:border-deep-ink")}
      >
        {options.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label ?? account.type} · {formatTnd(account.balance)}
          </option>
        ))}
      </select>
      <Button variant="inverse" size="lg" className="mt-6 w-full" loading={pay.isPending} disabled={!accountId} onClick={() => pay.mutate()}>
        Pay this instalment
      </Button>
    </section>
  );
}

function Notice({
  tone,
  icon,
  title,
  children,
}: {
  tone: "gold" | "negative" | "positive";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const border = { gold: "border-gold", negative: "border-negative", positive: "border-positive" }[tone];
  return (
    <div className={`flex gap-4 border-l-4 bg-paper-2 p-6 ${border}`}>
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold">{title}</p>
        {children}
      </div>
    </div>
  );
}

export default function LoanPage() {
  const { id } = useParams<{ id: string }>();
  const query = useLoan(id);

  if (query.isLoading) return <p className="text-ink-soft">Loading...</p>;
  if (query.error || !query.data) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="border-2 border-dashed border-ink/25 p-12 text-center">
        <p className="font-display condensed text-4xl">{missing ? "Loan not found." : "Something went wrong."}</p>
        <Link href="/loans" className="mt-4 inline-block text-sm font-semibold text-brand underline decoration-2 underline-offset-4">
          Back to loans
        </Link>
      </div>
    );
  }

  const loan = query.data;

  return (
    <div className="space-y-12">
      <Link href="/loans" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Loans
      </Link>

      <header className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold text-ink-soft">{loan.product.name}</p>
            <StatusBadge status={loan.status} />
          </div>
          <h1 className="font-display condensed mt-2 text-6xl leading-[0.9] text-ink sm:text-8xl">
            {formatTnd(loan.amount)}
          </h1>
          <p className="num mt-4 text-sm text-ink-soft">
            {loan.durationMonths} months at {Number(loan.interestRate).toFixed(2)} % · {formatTnd(loan.monthlyPayment)} a month
          </p>
        </div>
        <div className="border-t-2 border-ink pt-4 sm:text-right">
          <p className="text-sm text-ink-soft">Total to repay</p>
          <p className="font-display mt-1 text-4xl">{formatTnd(loan.totalPayment)}</p>
          <p className="num mt-1 text-sm text-ink-soft">of which interest {formatTnd(loan.totalInterest)}</p>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-10">
          {loan.status === "PENDING" && (
            <Notice tone="gold" icon={<Clock className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden="true" />} title="Waiting for a decision">
              <p className="mt-1 text-ink-soft">
                The bank is reviewing your application, in the order received.
                {loan.flagged && " Your repayments exceed this product's debt ratio, so it will get a closer look."}
              </p>
            </Notice>
          )}
          {loan.status === "REJECTED" && (
            <Notice tone="negative" icon={<XCircle className="mt-0.5 size-6 shrink-0 text-negative" aria-hidden="true" />} title="Application declined">
              <p className="mt-1">{loan.rejectionReason}</p>
            </Notice>
          )}
          {(loan.status === "APPROVED" || loan.status === "PAID_OFF") && (
            <Notice
              tone="positive"
              icon={<CheckCircle2 className="mt-0.5 size-6 shrink-0 text-positive" aria-hidden="true" />}
              title={loan.status === "PAID_OFF" ? "Fully repaid" : "Approved and paid out"}
            >
              <p className="mt-1 text-ink-soft">
                {formatTnd(loan.amount)} reached {loan.account.label ?? "your account"} (
                <span className="num">{formatIban(loan.account.iban)}</span>)
                {loan.disbursedAt && ` on ${formatDate(loan.disbursedAt)}`}.
              </p>
              <div className="mt-5 max-w-sm">
                <LoanProgress paid={loan.paidInstallments} total={loan.durationMonths} />
              </div>
            </Notice>
          )}

          {loan.purpose && (
            <p>
              <span className="mr-2 text-sm font-semibold text-ink-soft">Purpose</span>
              {loan.purpose}
            </p>
          )}

          {loan.schedule.length > 0 && (
            <div className="space-y-5">
              <SectionHeading>{loan.status === "PENDING" ? "Repayment preview" : "Repayment schedule"}</SectionHeading>
              <LoanSchedule schedule={loan.schedule} />
            </div>
          )}
        </div>

        {loan.status === "APPROVED" && <RepayPanel key={loan.paidInstallments} loan={loan} />}
      </div>
    </div>
  );
}
