import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-card p-5",
        tone === "warn" ? "border-gold" : "border-ink shadow-[3px_3px_0_0_var(--ink)]",
      )}
    >
      <p className="num text-[11px] tracking-[0.18em] text-ink-soft uppercase">{label}</p>
      <p className="num mt-2 text-2xl font-semibold sm:text-3xl">{value}</p>
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
    </div>
  );
}