"use client";

import { ArrowUpDown, RotateCcw } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Key = "current" | "savings";
type Entry = { id: string; ok: boolean; from: Key; to: Key; amount: number };

// All money is kept in integer millimes (1 TND = 1000), never floats.
const START: Record<Key, number> = { current: 2_500_000, savings: 8_200_000 };
const LABEL: Record<Key, string> = { current: "Current account", savings: "Savings account" };

function tnd(millimes: number) {
  const whole = Math.floor(millimes / 1000);
  const frac = String(millimes % 1000).padStart(3, "0");
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${frac}`;
}

function AccountRow({
  side,
  name,
  balance,
  delta,
  flash,
}: {
  side: "debit" | "credit";
  name: string;
  balance: number;
  delta: number;
  flash: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm text-deep-ink/60">{side === "debit" ? "From" : "To"}</p>
        <p className="mt-1 text-lg font-semibold">{name}</p>
      </div>
      <div className="text-right">
        <p className={cn("font-display text-5xl transition-colors duration-500", flash ? "text-gold" : "text-deep-ink")}>
          {tnd(balance)}
        </p>
        <p className={cn("num mt-1.5 text-xs", side === "debit" ? "text-hot" : "text-deep-ink/70")}>
          {side === "debit" ? "−" : "+"} {tnd(delta)}
        </p>
      </div>
    </div>
  );
}

export function TransferConsole() {
  const [balances, setBalances] = useState<Record<Key, number>>(START);
  const [from, setFrom] = useState<Key>("current");
  const [amount, setAmount] = useState(150);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [journal, setJournal] = useState<Entry[]>([]);
  const counter = useRef(1);

  const to: Key = from === "current" ? "savings" : "current";
  const max = Math.max(1, Math.min(1000, Math.floor(balances[from] / 1000)));
  const value = Math.min(amount, max);
  const millimes = value * 1000;
  const canSend = !busy && balances[from] >= 1000;
  const settled = journal.filter((e) => e.ok).reduce((sum, e) => sum + e.amount, 0);
  const fill = max > 1 ? ((value - 1) / (max - 1)) * 100 : 0;

  function run(crash: boolean) {
    if (!canSend) return;
    setBusy(true);
    const id = `TX-${String(counter.current++).padStart(4, "0")}`;
    window.setTimeout(() => {
      if (!crash) {
        setBalances((b) => ({ ...b, [from]: b[from] - millimes, [to]: b[to] + millimes }));
        setFlash(true);
        window.setTimeout(() => setFlash(false), 900);
      }
      setJournal((j) => [{ id, ok: !crash, from, to, amount: millimes }, ...j]);
      setBusy(false);
    }, 700);
  }

  function reset() {
    setBalances(START);
    setJournal([]);
    setFrom("current");
    setAmount(150);
    counter.current = 1;
  }

  return (
    <div className="border-t-8 border-brand bg-deep text-deep-ink">
      <div className="flex items-center justify-between border-b border-deep-ink/15 px-5 py-3.5 sm:px-7">
        <p className="text-sm font-semibold">Transfer console</p>
        <p className="text-xs text-deep-ink/55">Simulation · all amounts in TND</p>
      </div>

      <div className="p-5 sm:p-7">
        <AccountRow side="debit" name={LABEL[from]} balance={balances[from]} delta={millimes} flash={flash} />

        <div className="my-5 flex items-center">
          <div className="h-px flex-1 bg-deep-ink/15" />
          <button
            type="button"
            onClick={() => setFrom(to)}
            disabled={busy}
            aria-label="Swap direction"
            className="mx-3 grid size-9 cursor-pointer place-items-center rounded-[3px] border border-deep-ink/30 text-deep-ink/70 transition-colors hover:border-deep-ink hover:text-deep-ink disabled:opacity-50"
          >
            <ArrowUpDown className="size-4" />
          </button>
          <div className="h-px flex-1 bg-deep-ink/15" />
        </div>

        <AccountRow side="credit" name={LABEL[to]} balance={balances[to]} delta={millimes} flash={flash} />

        <div className="mt-9">
          <div className="flex items-baseline justify-between">
            <label htmlFor="amount" className="text-sm font-semibold">
              Amount to send
            </label>
            <p className="font-display text-3xl">
              {tnd(millimes)} <span className="text-base font-medium text-deep-ink/60">TND</span>
            </p>
          </div>
          <input
            id="amount"
            type="range"
            min={1}
            max={max}
            step={1}
            value={value}
            disabled={busy}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ "--fill": `${fill}%`, "--rule": "rgb(255 255 255 / 0.2)", "--card": "var(--deep)", "--ink": "var(--deep-ink)", "--brand": "var(--hot)" } as CSSProperties}
            className="slider mt-3"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Button variant="inverse" size="lg" onClick={() => run(false)} disabled={!canSend} loading={busy}>
            Send {tnd(millimes)} TND
          </Button>
          <Button variant="inverse-outline" size="lg" onClick={() => run(true)} disabled={!canSend}>
            Pull the plug
          </Button>
        </div>
        <p className="mt-3 text-sm text-deep-ink/60">
          “Pull the plug” crashes the server in the middle of the transfer. Watch what happens to your money.
        </p>
      </div>

      <div className="border-t border-deep-ink/15 bg-deep-ink/5 px-5 py-5 sm:px-7" aria-live="polite">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Journal</p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-deep-ink/60 transition-colors hover:text-deep-ink"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        </div>

        {journal.length === 0 ? (
          <p className="text-sm text-deep-ink/60">Nothing yet. Send some money.</p>
        ) : (
          <>
            <div className="mb-2 grid grid-cols-[1fr_5.5rem_5.5rem] gap-x-3 text-xs text-deep-ink/55">
              <span>Account</span>
              <span className="text-right">Debit</span>
              <span className="text-right">Credit</span>
            </div>
            <ul className="space-y-4">
              {journal.slice(0, 3).map((e) => (
                <li key={e.id} className="num text-xs">
                  <div className="flex items-center justify-between text-deep-ink/60">
                    <span>{e.id}</span>
                    <span className={e.ok ? "text-deep-ink" : "text-hot"}>{e.ok ? "settled" : "rolled back"}</span>
                  </div>
                  {e.ok ? (
                    <div className="mt-1.5 grid grid-cols-[1fr_5.5rem_5.5rem] gap-x-3 gap-y-1">
                      <span>{LABEL[e.from]}</span>
                      <span className="text-right">{tnd(e.amount)}</span>
                      <span />
                      <span>{LABEL[e.to]}</span>
                      <span />
                      <span className="text-right">{tnd(e.amount)}</span>
                    </div>
                  ) : (
                    <p className="mt-1.5 font-sans text-sm text-deep-ink/70">
                      Crashed mid-transfer. Nothing was debited, nothing was credited.
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {settled > 0 && (
              <div className="num mt-4 grid grid-cols-[1fr_5.5rem_5.5rem] gap-x-3 border-t-4 border-double border-deep-ink/30 pt-3 text-xs font-semibold">
                <span className="font-normal text-deep-ink/60">Totals · balanced</span>
                <span className="text-right">{tnd(settled)}</span>
                <span className="text-right">{tnd(settled)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
