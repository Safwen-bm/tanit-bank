import { ButtonLink } from "@/components/ui/button-link";
import { Guilloche } from "@/components/ui/guilloche";
import { Photo } from "@/components/ui/photo";

export function HomeCta() {
  return (
    <section className="relative isolate overflow-hidden bg-deep text-deep-ink">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[58%]">
        <Photo
          src="/images/cards.jpg"
          alt=""
          dark
          sizes="60vw"
          className="h-full w-full"
          fallback={<Guilloche className="size-[120%] text-hot/25" />}
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-deep via-deep/85 to-deep/10" />

      <div className="mx-auto max-w-[84rem] px-6 py-28 lg:px-10 lg:py-44">
        <h2 className="font-display condensed max-w-3xl text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.88]">
          Open an account. Check our math.
        </h2>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-deep-ink/75">
          Create a free customer account and try accounts, transfers and loans with simulated money.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/register" variant="inverse" size="lg">
            Open an account
          </ButtonLink>
          <ButtonLink href="/loans/simulator" variant="inverse-outline" size="lg">
            Try the simulator
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
