"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import type { Account, AccountType } from "@/lib/types";

export function OpenAccountForm() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AccountType>("SAVINGS");
  const [label, setLabel] = useState("");

  const mutation = useMutation({
    mutationFn: () => api<Account>("/accounts", { method: "POST", body: { type, label: label.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Account opened");
      setLabel("");
      setOpen(false);
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rule text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        <Plus className="size-6" aria-hidden="true" />
        <span className="text-sm font-medium">Open another account</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className="space-y-5 rounded-xl border-2 border-ink bg-card p-6"
    >
      <Field label="Type" htmlFor="new-type">
        <select
          id="new-type"
          value={type}
          onChange={(event) => setType(event.target.value as AccountType)}
          className={inputClass}
        >
          <option value="SAVINGS">Savings</option>
          <option value="CURRENT">Current</option>
        </select>
      </Field>
      <Field label="Name (optional)" htmlFor="new-label">
        <input
          id="new-label"
          value={label}
          maxLength={40}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Holiday fund"
          className={inputClass}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={mutation.isPending}>
          Open account
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}