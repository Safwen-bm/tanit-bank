import { TanitMark } from "@/components/tanit-mark";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main className="ledger flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <TanitMark className="size-12 text-brand" />
      <p className="num text-xs tracking-[0.3em] text-accent uppercase">Error 404</p>
      <h1 className="font-display max-w-xl text-5xl font-semibold tracking-tight sm:text-6xl">
        This page is not in the books.
      </h1>
      <p className="max-w-md text-ink-soft">The address may be wrong, or the page may have moved.</p>
      <ButtonLink href="/">Back to the front page</ButtonLink>
    </main>
  );
}