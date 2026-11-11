import { FadeUp } from "./motion";

/**
 * Real "CTA" section (scraped): full-bleed black band, two serif lines —
 * "Backed by insights from 1,400+ businesses." / "Try … AI and see what
 * it's all about." — with the button pair "Start for free" (lime) +
 * "See how it works" (glass) and the "No credit card required." footnote.
 */
export function FinalCta() {
  return (
    <section className="relative px-4 pt-[40px] pb-[150px] sm:px-6">
      <FadeUp className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <h2 className="font-display text-balance text-[44px] leading-[1.1] text-foreground">
          Backed by insights from{" "}
          <span className="text-lime">1,400+</span> businesses.
        </h2>
        <p className="font-display mt-2 text-balance text-3xl leading-tight text-foreground sm:text-4xl">
          Try <em className="text-lime">Loopcart AI</em> and see what
          it&apos;s all about.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#"
            className="rounded-lg bg-lime px-8 py-3 text-[15px] font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-85 active:scale-[0.98]"
          >
            Start for free
          </a>
          <a
            href="#"
            className="rounded-lg border border-white/12 bg-white/5 px-8 py-3 text-[15px] font-medium text-foreground backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.98]"
          >
            See how it works
          </a>
        </div>
        <p className="mt-5 text-sm text-foreground/50">
          No credit card required.
        </p>
      </FadeUp>
    </section>
  );
}
