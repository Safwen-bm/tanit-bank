import Link from "next/link";
import { Guilloche } from "@/components/ui/guilloche";
import { TanitLogo } from "@/components/tanit-logo";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col justify-between overflow-hidden bg-brand px-6 py-10 text-brand-ink lg:px-10">
      <Guilloche className="absolute -right-48 -bottom-64 -z-10 size-[56rem] text-brand-ink/14" />

      <Link href="/" aria-label="Tanit Bank, home" className="w-fit">
        <TanitLogo onBrand />
      </Link>

      <div>
        <p
          aria-hidden="true"
          className="font-display condensed text-[clamp(9rem,34vw,28rem)] leading-[0.78] font-extrabold tracking-normal"
        >
          404
        </p>
        <h1 className="font-display condensed mt-8 text-4xl sm:text-6xl">This page is not in the books.</h1>
        <p className="mt-4 max-w-md text-lg text-brand-ink/85">The address may be wrong, or the page may have moved.</p>
        <div className="mt-9">
          <ButtonLink href="/" variant="inverse" size="lg">
            Back to the front page
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
