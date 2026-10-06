"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { THEMES } from "./theme-provider";

const SWATCH: Record<(typeof THEMES)[number], { label: string; colors: [string, string] }> = {
  sable: { label: "Sable", colors: ["#f3ecdf", "#c4512d"] },
  nuit: { label: "Nuit", colors: ["#0d1416", "#e0aa3e"] },
  lagune: { label: "Lagune", colors: ["#e6eeea", "#134e5e"] },
};

const subscribe = () => () => {};

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-1 rounded-full border border-rule bg-card p-1"
    >
      {THEMES.map((name) => {
        const active = mounted && theme === name;
        const { label, colors } = SWATCH[name];
        return (
          <button
            key={name}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(name)}
            className={cn(
              "flex items-center gap-2 rounded-full text-xs font-medium transition-colors",
              compact ? "p-2" : "px-3 py-1.5",
              active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
            )}
          >
            <span
              className="size-3 rounded-full border border-black/10"
              style={{ background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` }}
            />
            {compact ? <span className="sr-only">{label}</span> : label}
          </button>
        );
      })}
    </div>
  );
}