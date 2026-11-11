import { ShoppingBag } from "lucide-react";
import { FadeUp } from "./motion";

/**
 * Real "Install Markopoloai" card (scraped at 1440px, 202px tall): a
 * full-width rounded card whose background brightens from near-black at
 * the top to a lit olive green at the bottom, carrying the "Pattern
 * Texture" grain (real scraped asset) and a huge dark wordmark glyph
 * watermark on the left. Copy is serif on two lines with "instantly!"
 * italic, and a light-green button with the Shopify bag icon on the right.
 */
export function InstallBar() {
  return (
    <section className="relative mt-[41px]">
      <div className="mx-auto max-w-[1128px] px-4 sm:px-6">
        <FadeUp>
          <div className="relative flex min-h-[202px] flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl px-8 py-9 text-center sm:flex-row sm:justify-between sm:text-left">
            {/* Scraped gradient: dark top -> lit olive bottom */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, #030502 0%, #0c1304 38%, #35481a 72%, #6d9430 100%)",
              }}
              aria-hidden
            />
            {/* Real "Pattern Texture" grain (scraped asset) */}
            <div
              className="pointer-events-none absolute inset-0 bg-repeat opacity-20 mix-blend-overlay"
              style={{ backgroundImage: "url(/images/pattern-texture.png)" }}
              aria-hidden
            />
            {/* Huge watermark glyph of the wordmark, clipped on the left,
                with the small sparkle at its top-left like the original */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-2 bottom-0 select-none font-display text-[240px] leading-none text-black/35"
            >
              l
            </span>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-[52px] top-[38px] h-4 w-4 fill-white/25"
              aria-hidden
            >
              <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z" />
            </svg>

            <div className="relative">
              <p className="font-display text-2xl leading-snug text-foreground sm:text-[28px]">
                Already on Shopify?
              </p>
              <p className="font-display text-2xl leading-snug text-foreground sm:text-[28px]">
                Get Loopcart AI up and running{" "}
                <em className="text-lime">instantly</em>!
              </p>
            </div>

            <a
              href="#"
              className="relative inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#d7f26a] px-5 py-2.5 text-sm font-semibold text-[#0d1504] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Install Loopcart AI
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
