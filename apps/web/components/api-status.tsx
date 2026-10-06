"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Health = { status: string; db: "up" | "down"; uptime: number };
type State = { kind: "loading" } | { kind: "ok"; health: Health } | { kind: "down" };

export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Health>) : Promise.reject()))
      .then((health) => !cancelled && setState({ kind: "ok", health }))
      .catch(() => !cancelled && setState({ kind: "down" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const ok = state.kind === "ok" && state.health.db === "up";
  const label =
    state.kind === "loading"
      ? "Checking the vault…"
      : ok
        ? "API and database online"
        : "API unreachable";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-rule bg-card px-4 py-3">
      <span
        className={cn(
          "size-2.5 rounded-full",
          state.kind === "loading" && "animate-pulse bg-gold",
          ok && "bg-positive",
          state.kind === "down" && "bg-negative",
        )}
      />
      <span className="num text-sm">{label}</span>
      {state.kind === "ok" && (
        <span className="num ml-auto text-xs text-ink-soft">uptime {state.health.uptime}s</span>
      )}
    </div>
  );
}