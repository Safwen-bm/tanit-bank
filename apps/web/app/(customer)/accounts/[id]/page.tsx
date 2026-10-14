"use client";

import { ArrowLeft, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CashDesk } from "@/components/accounts/cash-desk";
import { Statement } from "@/components/accounts/statement";
import { ApiError } from "@/lib/api";
import { formatIban, formatTnd } from "@/lib/format";
import { useAccount } from "@/lib/queries";

export default function AccountPage() {
  const { id } = useParams<{ id: string }>();
  const account = useAccount(id);
  const [copied, setCopied] = useState(false);

  if (account.isLoading) return <p className="text-ink-soft">Loading...</p>;

  if (account.error || !account.data) {
    const missing = account.error instanceof ApiError && account.error.status === 404;
    return (
      <div className="border-2 border-dashed border-ink/25 p-12 text-center">
        <p className="font-display condensed text-4xl">{missing ? "Account not found." : "Something went wrong."}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand underline decoration-2 underline-offset-4">
          Back to overview
        </Link>
      </div>
    );
  }

  const { data } = account;

  async function copyIban() {
    await navigator.clipboard.writeText(data.iban);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-12">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Overview
      </Link>

      <header className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-lg font-semibold text-ink-soft">
            {data.type === "CURRENT" ? "Current account" : "Savings account"}
            {data.status !== "ACTIVE" && (
              <span className="ml-3 text-negative capitalize">{data.status.toLowerCase()}</span>
            )}
          </p>
          <h1 className="font-display condensed mt-2 text-5xl leading-[0.92] text-ink sm:text-7xl">
            {data.label ?? "Untitled account"}
          </h1>
          <button
            onClick={copyIban}
            className="num mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
            aria-label="Copy IBAN"
          >
            {formatIban(data.iban)}
            {copied ? <Check className="size-4 text-positive" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <div className="border-t-2 border-ink pt-4 sm:text-right">
          <p className="text-sm text-ink-soft">Balance</p>
          <p className="font-display condensed mt-1 text-5xl text-ink sm:text-6xl">{formatTnd(data.balance)}</p>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
        <Statement accountId={data.id} />
        <CashDesk account={data} />
      </div>
    </div>
  );
}
