"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LoanSchedule } from "@/components/loans/loan-schedule";
import { StatusBadge } from "@/components/loans/status-badge";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import { formatDate, formatIban, formatTnd } from "@/lib/format";
import { useAdminApplication } from "@/lib/queries";
import type { AdminLoanItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function Fact({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <dt className="num text-[11px] tracking-[0.15em] text-ink-soft uppercase">{label}</dt>
      <dd className={cn("num mt-1 font-semibold", warn && "text-negative")}>{value}</dd>
    </div>
  );
}

export function ApplicationCard({ item }: { item: AdminLoanItem }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [override, setOverride] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const detail = useAdminApplication(item.id, open);
  const pending = item.status === "PENDING";
  const ratio = (Number(item.debtRatio) * 100).toFixed(1);

  const approve = useMutation({
    mutationFn: () =>
      api(`/admin/loan-applications/${item.id}/approve`, {
        method: "POST",
        body: item.flagged ? { overrideDebtRatio: true } : {},
      }),
    onSuccess: () => {
      toast.success(`Approved. ${formatTnd(item.amount)} paid to ${item.customer.fullName}.`);
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  const reject = useMutation({
    mutationFn: () =>
      api(`/admin/loan-applications/${item.id}/reject`, { method: "POST", body: { reason: reason.trim() } }),
    onSuccess: () => {
      toast.success("Application declined");
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <article className="rounded-xl border-2 border-ink bg-card">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-4 p-6 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-xl font-semibold">{item.customer.fullName}</h3>
            <StatusBadge status={item.status} />
            {item.flagged && (
              <span className="num inline-flex items-center gap-1 rounded border border-negative px-2 py-0.5 text-[10px] tracking-wider text-negative uppercase">
                <TriangleAlert className="size-3" aria-hidden="true" />
                Debt ratio {ratio} %
              </span>
            )}
          </div>
          <p className="num mt-1 text-sm text-ink-soft">
            {item.product.name} · {item.durationMonths} months · applied {formatDate(item.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="num text-2xl font-semibold">{formatTnd(item.amount)}</p>
            <p className="num text-sm text-ink-soft">{formatTnd(item.monthlyPayment)} / month</p>
          </div>
          <ChevronDown className={cn("size-5 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </div>
      </button>

      {open && (
        <div className="space-y-6 border-t-2 border-dashed border-rule p-6">
          {detail.isLoading || !detail.data ? (
            <p className="text-ink-soft">Loading...</p>
          ) : (
            <>
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Fact label="Customer" value={detail.data.customer.email} />
                <Fact
                  label="Declared income"
                  value={detail.data.customer.monthlyIncome ? formatTnd(detail.data.customer.monthlyIncome) : "Not set"}
                />
                <Fact label="Other monthly payments" value={formatTnd(detail.data.customer.otherCommitments)} />
                <Fact
                  label="Total debt ratio"
                  value={`${ratio} %${detail.data.flagged ? " (over the limit)" : ""}`}
                  warn={detail.data.flagged}
                />
                <Fact label="Rate (locked)" value={`${Number(detail.data.interestRate).toFixed(2)} %`} />
                <Fact label="Total interest" value={formatTnd(detail.data.totalInterest)} />
                <Fact label="Pays into" value={formatIban(detail.data.account.iban)} />
                <Fact label="Purpose" value={detail.data.purpose ?? "Not given"} />
              </dl>

              {detail.data.status === "REJECTED" && (
                <p className="rounded-lg border-2 border-negative px-4 py-3 text-sm">
                  <strong>Declined:</strong> {detail.data.rejectionReason}
                </p>
              )}

              <LoanSchedule schedule={detail.data.schedule} preview={6} />

              {pending && (
                <div className="space-y-4 border-t-2 border-dashed border-rule pt-6">
                  {item.flagged && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-gold p-4 text-sm">
                      <input
                        type="checkbox"
                        checked={override}
                        onChange={(event) => setOverride(event.target.checked)}
                        className="mt-0.5 size-5 accent-brand"
                      />
                      <span>
                        I confirm this application is over the product&apos;s debt ratio limit and I approve it anyway.
                        This is recorded in the audit log.
                      </span>
                    </label>
                  )}

                  {rejecting ? (
                    <div className="space-y-3">
                      <label htmlFor={`reason-${item.id}`} className="num block text-[11px] tracking-[0.18em] text-ink-soft uppercase">
                        Reason shown to the customer
                      </label>
                      <textarea
                        id={`reason-${item.id}`}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        maxLength={300}
                        rows={3}
                        className={`${inputClass} resize-none border-2 px-3`}
                      />
                      <div className="flex gap-3">
                        <Button
                          loading={reject.isPending}
                          disabled={reason.trim().length < 3}
                          onClick={() => reject.mutate()}
                        >
                          Decline application
                        </Button>
                        <Button variant="ghost" onClick={() => setRejecting(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        loading={approve.isPending}
                        disabled={item.flagged && !override}
                        onClick={() => approve.mutate()}
                      >
                        Approve and disburse {formatTnd(item.amount)}
                      </Button>
                      <Button variant="outline" onClick={() => setRejecting(true)}>
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}