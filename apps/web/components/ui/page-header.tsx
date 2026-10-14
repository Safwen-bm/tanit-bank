import type { ReactNode } from "react";

/** The title block of every signed-in page. The sidebar already says where you are, so there is no eyebrow label. */
export function PageHeader({
  title,
  children,
  action,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
      <div className="min-w-0">
        <h1 className="font-display condensed text-5xl leading-[0.92] text-ink sm:text-7xl">{title}</h1>
        {children && <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{children}</p>}
      </div>
      {action}
    </header>
  );
}
