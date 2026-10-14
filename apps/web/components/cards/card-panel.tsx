"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Snowflake } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import { formatIban, formatTnd } from "@/lib/format";
import { useIdempotencyKey } from "@/lib/idempotency";
import type { BankCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CardVisual } from "./card-visual";

const AMOUNT = /^\d{1,7}(\.\d{1,3})?$/;

export function CardPanel({ card }: { card: BankCard }) {
  const queryClient = useQueryClient();
  const key = useIdempotencyKey();
  const [limit, setLimit] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");

  const frozen = card.status === "FROZEN";
  const limitText = limit ?? Number(card.spendingLimit).toString();
  const limitValid = AMOUNT.test(limitText) && Number(limitText) > 0 && limitText !== Number(card.spendingLimit).toString();
  const used = Math.min((Number(card.spentThisMonth) / Number(card.spendingLimit)) * 100, 100);

  const update = useMutation({
    mutationFn: (body: { status?: "ACTIVE" | "FROZEN"; spendingLimit?: string }) =>
      api<BankCard>(`/cards/${card.id}`, { method: "PATCH", body }),
    onSuccess: (_card, body) => {
      toast.success(body.status ? (body.status === "FROZEN" ? "Card frozen" : "Card active again") : "Limit updated");
      setLimit(null);
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  const pay = useMutation({
    mutationFn: () =>
      api<{ card: BankCard }>(`/cards/${card.id}/pay`, {
        method: "POST",
        body: { merchant: merchant.trim(), amount },
        headers: { "Idempotency-Key": key.current() },
      }),
    onSuccess: (result) => {
      toast.success(`Paid ${formatTnd(amount)} to ${merchant.trim()}. ${formatTnd(result.card.remainingThisMonth)} left this month.`);
      setMerchant("");
      setAmount("");
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
    onSettled: (_data, error) => key.settle(error),
  });

  const payValid = merchant.trim().length >= 2 && AMOUNT.test(amount) && Number(amount) > 0;

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-start">
      <div>
        <CardVisual card={card} />
        <p className="num mt-5 text-xs text-ink-soft">
          Spends from {card.account.label ?? "your account"} · {formatIban(card.account.iban)}
        </p>
      </div>

      <div className="space-y-8 border border-t-8 border-ink/20 border-t-brand bg-card p-6 sm:p-8">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold">Spent this month</p>
            <p className="num text-sm">
              {formatTnd(card.spentThisMonth)} of {formatTnd(card.spendingLimit)}
            </p>
          </div>
          <div className="mt-3 h-3 bg-ink/10" role="progressbar" aria-valuenow={Math.round(used)} aria-valuemin={0} aria-valuemax={100}>
            <div className={cn("h-full", used >= 100 ? "bg-negative" : used >= 80 ? "bg-gold" : "bg-brand")} style={{ width: `${used}%` }} />
          </div>
          <p className="num mt-2 text-xs text-ink-soft">{formatTnd(card.remainingThisMonth)} left</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label htmlFor={`limit-${card.id}`} className="mb-2 block text-sm font-semibold">
              Monthly limit (TND)
            </label>
            <input
              id={`limit-${card.id}`}
              inputMode="decimal"
              value={limitText}
              onChange={(event) => setLimit(event.target.value)}
              className={`${inputClass} num`}
            />
          </div>
          <Button
            variant="outline"
            disabled={!limitValid}
            loading={update.isPending && update.variables?.spendingLimit !== undefined}
            onClick={() => update.mutate({ spendingLimit: limitText })}
          >
            Save limit
          </Button>
          <Button
            variant={frozen ? "primary" : "outline"}
            loading={update.isPending && update.variables?.status !== undefined}
            onClick={() => update.mutate({ status: frozen ? "ACTIVE" : "FROZEN" })}
          >
            <Snowflake className="size-4" aria-hidden="true" />
            {frozen ? "Unfreeze" : "Freeze card"}
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (payValid) pay.mutate();
          }}
          className="space-y-4 border-t border-ink/20 pt-7"
        >
          <p className="font-display condensed text-3xl">Try a payment</p>
          <p className="-mt-2 text-sm text-ink-soft">Simulates a purchase with this card. No real money moves.</p>
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <input
              aria-label="Merchant"
              placeholder="Merchant, e.g. Carrefour"
              value={merchant}
              maxLength={60}
              onChange={(event) => setMerchant(event.target.value)}
              className={inputClass}
            />
            <input
              aria-label="Amount in TND"
              inputMode="decimal"
              placeholder="42.500"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={`${inputClass} num`}
            />
          </div>
          <Button type="submit" size="lg" loading={pay.isPending} disabled={!payValid} className="w-full">
            Pay with this card
          </Button>
        </form>
      </div>
    </article>
  );
}
