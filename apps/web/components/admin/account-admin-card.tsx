"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatIban, formatTnd } from "@/lib/format";
import type { Account, AccountStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTIONS: Record<AccountStatus, { label: string; to: AccountStatus; variant: "outline" | "ghost" }[]> = {
  ACTIVE: [
    { label: "Freeze", to: "FROZEN", variant: "outline" },
    { label: "Close", to: "CLOSED", variant: "ghost" },
  ],
  FROZEN: [
    { label: "Unfreeze", to: "ACTIVE", variant: "outline" },
    { label: "Close", to: "CLOSED", variant: "ghost" },
  ],
  CLOSED: [{ label: "Reopen", to: "ACTIVE", variant: "outline" }],
};

const STATUS_STYLE: Record<AccountStatus, string> = {
  ACTIVE: "border-positive text-positive",
  FROZEN: "border-gold text-gold",
  CLOSED: "border-ink-soft text-ink-soft",
};

export function AccountAdminCard({ account }: { account: Account }) {
  const queryClient = useQueryClient();
  const change = useMutation({
    mutationFn: (status: AccountStatus) =>
      api(`/admin/accounts/${account.id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      toast.success("Account updated");
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <article className="rounded-xl border-2 border-ink bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">
            {account.type === "CURRENT" ? "Current" : "Savings"}
          </p>
          <p className="font-display mt-1 text-lg font-semibold">{account.label ?? "Untitled account"}</p>
        </div>
        <span className={cn("num rounded border px-2 py-0.5 text-[10px] tracking-wider uppercase", STATUS_STYLE[account.status])}>
          {account.status}
        </span>
      </div>
      <p className="num mt-4 text-2xl font-semibold">{formatTnd(account.balance)}</p>
      <p className="num mt-1 text-xs text-ink-soft">{formatIban(account.iban)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS[account.status].map((action) => (
          <Button
            key={action.to}
            size="sm"
            variant={action.variant}
            loading={change.isPending && change.variables === action.to}
            onClick={() => change.mutate(action.to)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </article>
  );
}