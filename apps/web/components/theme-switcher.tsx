"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { THEMES } from "./theme-provider";

/** [surface, brand] : the swatch is split on the diagonal. */
const SWATCH: Record<(typeof THEMES)[number], { label: string; colors: [string, string] }> = {
  rouge: { label: "Rouge", colors: ["#f5f2f0", "#d9241a"] },
  olive: { label: "Olive", colors: ["#eff0e6", "#38572a"] },
  nuit: { label: "Nuit", colors: ["#0f0c0b", "#ff5a3c"] },
};

const subscribe = () => () => {};

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div role="radiogroup" aria-label="Theme" className="flex items-center gap-2.5">
      {THEMES.map((name) => {
        const active = mounted && theme === name;
        const { label, colors } = SWATCH[name];
        return (
          <button
            key={name}
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => setTheme(name)}
            className="group flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft transition-colors hover:text-ink aria-checked:text-ink"
          >
            <span
              className={cn(
                "size-5 rounded-[3px] ring-1 ring-ink/30 transition-all group-hover:ring-ink/60",
                active && "ring-2 ring-ink ring-offset-2 ring-offset-paper",
              )}
              style={{ background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` }}
            />
            {compact ? <span className="sr-only">{label}</span> : label}
          </button>
        );
      })}
    </div>
  );
}
