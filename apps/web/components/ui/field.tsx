import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-[3px] border border-ink/30 bg-card px-4 py-3.5 text-base text-ink outline-none transition placeholder:text-ink-soft/50 hover:border-ink/60 focus:border-ink focus:shadow-[0_3px_0_0_var(--brand)] disabled:cursor-not-allowed disabled:opacity-50";

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
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-negative">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}
