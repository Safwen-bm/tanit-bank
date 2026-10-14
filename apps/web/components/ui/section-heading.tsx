import type { ReactNode } from "react";

export function SectionHeading({
  children,
  hint,
  action,
}: {
  children: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display condensed text-3xl text-ink sm:text-4xl">{children}</h2>
        {hint && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** The small underlined link that sits at the right of a SectionHeading. */
export const sectionLinkClass = "shrink-0 text-sm font-semibold text-brand underline decoration-2 underline-offset-4";
