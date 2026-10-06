import type { ReactNode } from "react";

/** Ledger-style input: a ruled underline instead of a boxed field. */
export const inputClass =
  "w-full border-0 border-b-2 border-rule bg-transparent py-2 text-base outline-none transition-colors placeholder:text-ink-soft/50 focus:border-brand";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="num mb-1 block text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-negative">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}