import { cn } from "@/lib/utils";
import { TanitMark } from "./tanit-mark";

/**
 * Mark + wordmark.
 * `inverted` : for the always-dark surfaces. `onBrand` : for sections filled with the brand colour.
 */
export function TanitLogo({
  className,
  showWordmark = true,
  inverted = false,
  onBrand = false,
}: {
  className?: string;
  showWordmark?: boolean;
  inverted?: boolean;
  onBrand?: boolean;
}) {
  const mark = onBrand ? "text-brand-ink" : inverted ? "text-gold" : "text-brand";
  const word = onBrand ? "text-brand-ink" : inverted ? "text-deep-ink" : "text-ink";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <TanitMark className={cn("size-8", mark)} />
      {showWordmark && (
        <span className={cn("flex items-baseline gap-1.5 leading-none", word)}>
          <span className="font-display text-[1.7rem] font-extrabold tracking-tight">Tanit</span>
          <span className="text-sm font-medium opacity-70">Bank</span>
        </span>
      )}
    </span>
  );
}
