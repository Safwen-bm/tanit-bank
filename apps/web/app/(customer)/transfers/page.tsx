"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Field, inputClass } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
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
      <div className="border-t-8 border-brand bg-deep p-8 text-deep-ink sm:p-10">
        <p className="flex items-center gap-2 text-sm font-semibold text-hot">
          <CheckCircle2 className="size-5" aria-hidden="true" />
          Transfer sent
        </p>
        <p className="font-display condensed mt-4 text-[clamp(3.5rem,9vw,5.5rem)] leading-none">
          {formatTnd(tx.amount).replace(" TND", "")}
          <span className="ml-2 text-[0.3em] font-semibold text-deep-ink/70">TND</span>
        </p>
        <dl className="num mt-8 divide-y divide-deep-ink/15 border-y border-deep-ink/15 text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="font-sans text-deep-ink/60">To</dt>
            <dd className="text-right font-sans font-medium">{tx.counterparty?.name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="font-sans text-deep-ink/60">IBAN</dt>
            <dd className="text-right">{tx.counterparty ? formatIban(tx.counterparty.iban) : ""}</dd>
          </div>
          {tx.balanceAfter && (
            <div className="flex justify-between gap-4 py-3">
              <dt className="font-sans text-deep-ink/60">Balance after</dt>
              <dd className="text-right">{formatTnd(tx.balanceAfter)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 py-3">
            <dt className="font-sans text-deep-ink/60">Reference</dt>
            <dd className="text-right">{tx.id.slice(-12)}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            variant="inverse"
            onClick={() => {
              setReceipt(null);
              reset({ fromAccountId: active[0]?.id ?? "" });
            }}
          >
            New transfer
          </Button>
          <ButtonLink href="/dashboard" variant="inverse-outline">
            Back to overview
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-7 border border-t-8 border-ink/20 border-t-brand bg-card p-6 sm:p-8"
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
      <Button type="submit" size="lg" loading={mutation.isPending} disabled={active.length === 0} className="w-full">
        Send money
      </Button>
    </form>
  );
}

export default function TransfersPage() {
  const accounts = useAccounts();

  return (
    <div className="space-y-12">
      <PageHeader title="Send money.">
        Transfers are instant and atomic: the money leaves your account and reaches the recipient in one step, or
        nothing happens.
      </PageHeader>

      <div className="max-w-xl">
        {accounts.isLoading ? (
          <p className="text-ink-soft">Loading...</p>
        ) : accounts.data ? (
          <TransferForm accounts={accounts.data} />
        ) : (
          <p className="font-medium text-negative">Could not load your accounts.</p>
        )}
      </div>
    </div>
  );
}
