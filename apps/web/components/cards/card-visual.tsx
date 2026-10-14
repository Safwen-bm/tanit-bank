import { Guilloche } from "@/components/ui/guilloche";
import { TanitMark } from "@/components/tanit-mark";
import type { BankCard } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The card art. Only the last four digits exist anywhere in the system. */
export function CardVisual({ card }: { card: Pick<BankCard, "holderName" | "last4" | "expiryMonth" | "expiryYear" | "status"> }) {
  const frozen = card.status === "FROZEN";
  return (
    <div
      className={cn(
        "relative isolate aspect-[1.586] w-full max-w-sm overflow-hidden rounded-md bg-brand p-6 text-brand-ink shadow-2xl shadow-black/25 transition-[filter] duration-300",
        frozen && "grayscale",
      )}
    >
      <Guilloche className="absolute -right-28 -bottom-32 -z-10 size-96 text-brand-ink/20" curves={9} points={420} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="block h-8 w-11 rounded-[3px] border border-black/30 bg-linear-to-br from-[#e8c46a] to-[#b88a2c]" aria-hidden="true">
            <span className="mx-auto mt-3 block h-px w-7 bg-black/30" />
          </span>
          <TanitMark className="size-8" />
        </div>

        <div>
          <p className="num text-lg tracking-[0.18em] sm:text-xl" aria-label={`Card ending ${card.last4}`}>
            •••• •••• •••• {card.last4}
          </p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] opacity-75">Card holder</p>
              <p className="num truncate text-sm tracking-wide">{card.holderName}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] opacity-75">Expires</p>
              <p className="num text-sm">
                {String(card.expiryMonth).padStart(2, "0")}/{String(card.expiryYear).slice(-2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {frozen && (
        <span className="font-display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-white/90 px-4 py-1 text-3xl font-extrabold tracking-[0.2em] text-white/90 uppercase">
          Frozen
        </span>
      )}
    </div>
  );
}
