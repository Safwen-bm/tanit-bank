// apps\web\app\(customer)\cards\page.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CardPanel } from "@/components/cards/card-panel";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/format";
import { useAccounts, useCards } from "@/lib/queries";
import type { BankCard } from "@/lib/types";

const MAX_CARDS = 3;

function IssueForm() {
  const queryClient = useQueryClient();
  const accounts = useAccounts();
  const [accountId, setAccountId] = useState("");
  const [limit, setLimit] = useState("1000");

  const active = accounts.data?.filter((account) => account.status === "ACTIVE") ?? [];
  const selected = active.find((account) => account.id === accountId) ?? active[0];
  const limitValid = /^\d{1,5}(\.\d{1,3})?$/.test(limit) && Number(limit) > 0 && Number(limit) <= 50000;

  const issue = useMutation({
    mutationFn: () => api<BankCard>("/cards", { method: "POST", body: { accountId: selected!.id, spendingLimit: limit } }),
    onSuccess: () => {
      toast.success("New card issued");
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  if (!selected) return null;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (limitValid) issue.mutate();
      }}
      className="max-w-xl space-y-6 rounded-xl border-2 border-dashed border-rule p-6"
    >
      <h2 className="font-display text-xl font-semibold">Order a card</h2>
      <Field label="Spends from" htmlFor="card-account">
        <select id="card-account" value={selected.id} onChange={(event) => setAccountId(event.target.value)} className={inputClass}>
          {active.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label ?? account.type} · {formatTnd(account.balance)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Monthly limit (TND)"
        htmlFor="card-limit"
        error={limitValid ? undefined : "Between 1 and 50000"}
        hint="You can change it at any time."
      >
        <input id="card-limit" inputMode="decimal" value={limit} onChange={(event) => setLimit(event.target.value)} className={`${inputClass} num`} />
      </Field>
      <Button type="submit" loading={issue.isPending} disabled={!limitValid}>
        Issue card
      </Button>
    </form>
  );
}

export default function CardsPage() {
  const cards = useCards();

  return (
    <div className="space-y-12">
      <header>
        <p className="num text-xs tracking-[0.25em] text-accent uppercase">Cards</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Your cards.</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Freeze a card in one tap, and set how much it may spend each month. A frozen card or a frozen account refuses
          every payment at once.
        </p>
      </header>

      {cards.isLoading ? (
        <p className="text-ink-soft">Loading...</p>
      ) : (
        <>
          {cards.data && cards.data.length > 0 ? (
            <div className="space-y-12">
              {cards.data.map((card) => (
                <CardPanel key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border-2 border-dashed border-rule p-8 text-center text-ink-soft">
              You have no card yet. Order your first one below.
            </p>
          )}
          {(cards.data?.length ?? 0) < MAX_CARDS ? (
            <IssueForm />
          ) : (
            <p className="text-sm text-ink-soft">You have reached the maximum of {MAX_CARDS} cards.</p>
          )}
        </>
      )}
    </div>
  );
}