import Link from "next/link";
import type { ReactNode } from "react";
import { Guilloche } from "./ui/guilloche";
import { Photo } from "./ui/photo";
import { TanitLogo } from "./tanit-logo";
import { ThemeSwitcher } from "./theme-switcher";

const PROMISES = [
  "Transfers settle atomically, or not at all.",
  "Loan rates are set by the bank, never by the browser.",
  "Every sensitive action leaves a line in the audit log.",
];

export function AuthShell({
  title,
  subtitle,
  headline,
  image,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  /** The statement set large over the photo. */
  headline: string;
  /** A path inside /public/images. */
  image: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[5fr_6fr]">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-deep p-12 text-deep-ink lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Photo
          src={image}
          alt=""
          dark
          eager
          sizes="42vw"
          className="absolute inset-0 -z-10 h-full w-full"
          fallback={<Guilloche className="size-[130%] text-hot/25" />}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-deep via-deep/60 to-deep/5" />

        <Link href="/" aria-label="Tanit Bank, home" className="w-fit">
          <TanitLogo inverted />
        </Link>

        <div>
          <h2 className="font-display condensed max-w-md text-7xl leading-[0.9] font-extrabold">{headline}</h2>
          <ul className="mt-10 max-w-sm space-y-3.5">
            {PROMISES.map((text) => (
              <li key={text} className="flex gap-3.5 text-sm leading-relaxed text-deep-ink/80">
                <span className="mt-[7px] size-2 shrink-0 bg-hot" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-deep-ink/55">Portfolio project. Not a licensed bank. No real money.</p>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" aria-label="Tanit Bank, home" className="lg:invisible">
            <TanitLogo />
          </Link>
          <ThemeSwitcher compact />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16 sm:px-0">
          <h1 className="font-display condensed text-6xl leading-[0.92] text-ink sm:text-7xl">{title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{subtitle}</p>
          <div className="mt-10">{children}</div>
          <div className="mt-8 text-sm text-ink-soft">{footer}</div>
        </div>
      </main>
    </div>
  );
}
