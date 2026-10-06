"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/format";
import { useIdempotencyKey } from "@/lib/idempotency";
import type { Account, MoneyResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  amount: z.string().regex(/^\d{1,7}(\.\d{1,3})?$/, "Enter an amount like 100 or 100.500"),
  description: z.string().max(140).optional(),
});
type FormValues = z.infer<typeof schema>;
type Mode = "deposit" | "withdraw";

export function CashDesk({ account }: { account: Account }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("deposit");
  const key = useIdempotencyKey();
  const disabled = account.status !== "ACTIVE";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api<MoneyResult>(`/transactions/${mode}`, {
        method: "POST",
        body: { accountId: account.id, amount: values.amount, description: values.description || undefined },
        headers: { "Idempotency-Key": key.current() },
      }),
    onSuccess: (result) => {
      toast.success(
        `${mode === "deposit" ? "Deposited" : "Withdrew"} ${formatTnd(result.transaction.amount)}`,
      );
      reset();
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
    onSettled: (_data, error) => key.settle(error),
  });

  return (
    <section className="rounded-xl border-2 border-ink bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Cash desk</h2>
        <div role="tablist" className="flex rounded-full border border-rule p-1 text-xs font-medium">
          {(["deposit", "withdraw"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 capitalize transition-colors",
                mode === value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Simulated cash desk. No real money moves.</p>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="mt-6 space-y-5" noValidate>
        <Field label="Amount (TND)" htmlFor="cash-amount" error={errors.amount?.message}>
          <input
            id="cash-amount"
            inputMode="decimal"
            placeholder="100.000"
            disabled={disabled}
            className={`${inputClass} num`}
            {...register("amount")}
          />
        </Field>
        <Field label="Note (optional)" htmlFor="cash-note" error={errors.description?.message}>
          <input id="cash-note" disabled={disabled} className={inputClass} {...register("description")} />
        </Field>
        <Button type="submit" loading={mutation.isPending} disabled={disabled} className="w-full">
          {mode === "deposit" ? "Deposit" : "Withdraw"}
        </Button>
        {disabled && <p className="text-sm text-negative">This account is {account.status.toLowerCase()}.</p>}
      </form>
    </section>
  );
}