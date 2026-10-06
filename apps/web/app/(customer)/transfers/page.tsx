"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import { formatIban, formatTnd } from "@/lib/format";
import { useIdempotencyKey } from "@/lib/idempotency";
import { useAccounts } from "@/lib/queries";
import type { Account, MoneyResult } from "@/lib/types";

const schema = z.object({
  fromAccountId: z.string().min(1, "Choose an account"),
  toIban: z.string().regex(/^TN[0-9 ]{22,30}$/i, "Enter a Tunisian IBAN (TN + 22 digits)"),
  amount: z.string().regex(/^\d{1,7}(\.\d{1,3})?$/, "Enter an amount like 25 or 25.500"),
  description: z.string().max(140).optional(),
});
type FormValues = z.infer<typeof schema>;

function TransferForm({ accounts }: { accounts: Account[] }) {
  const queryClient = useQueryClient();
  const key = useIdempotencyKey();
  const [receipt, setReceipt] = useState<MoneyResult | null>(null);

  const active = accounts.filter((account) => account.status === "ACTIVE");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fromAccountId: active[0]?.id ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api<MoneyResult>("/transfers", {
        method: "POST",
        body: { ...values, description: values.description || undefined },
        headers: { "Idempotency-Key": key.current() },
      }),
    onSuccess: (result) => {
      if (result.replayed) toast.info("This transfer was already processed");
      setReceipt(result);
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
    onSettled: (_data, error) => key.settle(error),
  });

  if (receipt) {
    const tx = receipt.transaction;
    return (
      <div className="rounded-xl border-2 border-ink bg-card p-8 shadow-[4px_4px_0_0_var(--ink)]">
        <CheckCircle2 className="size-10 text-positive" aria-hidden="true" />
        <h2 className="font-display mt-4 text-3xl font-semibold">Transfer sent</h2>
        <p className="num mt-4 text-4xl font-semibold">{formatTnd(tx.amount)}</p>
        <dl className="mt-6 space-y-3 border-t-2 border-dashed border-rule pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">To</dt>
            <dd className="text-right font-medium">{tx.counterparty?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">IBAN</dt>
            <dd className="num text-right">{tx.counterparty ? formatIban(tx.counterparty.iban) : ""}</dd>
          </div>
          {tx.balanceAfter && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Balance after</dt>
              <dd className="num text-right">{formatTnd(tx.balanceAfter)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Reference</dt>
            <dd className="num text-right">{tx.id.slice(-12)}</dd>
          </div>
        </dl>
        <div className="mt-8 flex gap-3">
          <Button
            onClick={() => {
              setReceipt(null);
              reset({ fromAccountId: active[0]?.id ?? "" });
            }}
          >
            New transfer
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost">Back to overview</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-7 rounded-xl border-2 border-ink bg-card p-8 shadow-[4px_4px_0_0_var(--ink)]"
      noValidate
    >
      <Field label="From" htmlFor="from" error={errors.fromAccountId?.message}>
        <select id="from" className={inputClass} {...register("fromAccountId")}>
          {active.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label ?? account.type} · {formatTnd(account.balance)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Recipient IBAN" htmlFor="toIban" error={errors.toIban?.message}>
        <input
          id="toIban"
          autoComplete="off"
          placeholder="TN59 0800 1000 0000 0000 0116"
          className={`${inputClass} num`}
          {...register("toIban")}
        />
      </Field>
      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Amount (TND)" htmlFor="amount" error={errors.amount?.message}>
          <input
            id="amount"
            inputMode="decimal"
            placeholder="25.000"
            className={`${inputClass} num`}
            {...register("amount")}
          />
        </Field>
        <Field label="Reference (optional)" htmlFor="description" error={errors.description?.message}>
          <input id="description" className={inputClass} {...register("description")} />
        </Field>
      </div>
      <Button type="submit" loading={mutation.isPending} disabled={active.length === 0} className="w-full">
        Send money
      </Button>
    </form>
  );
}

export default function TransfersPage() {
  const accounts = useAccounts();

  return (
    <div className="space-y-10">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Transfers</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Send money.</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Transfers are instant and atomic: the money leaves your account and reaches the recipient in one step, or
          nothing happens.
        </p>
      </header>

      <div className="max-w-xl">
        {accounts.isLoading ? (
          <p className="text-ink-soft">Loading...</p>
        ) : accounts.data ? (
          <TransferForm accounts={accounts.data} />
        ) : (
          <p className="text-negative">Could not load your accounts.</p>
        )}
      </div>
    </div>
  );
}