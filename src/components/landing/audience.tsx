"use client";

import { FadeUp, ParallaxBg } from "./motion";

/**
 * Real "Ecosystems" section (scraped): "Built for consumer brands of all
 * sizes." over the real backdrop — blue sky with lit clouds above bright
 * green hills (scraped asset YUHQddyA). Under the copy sit the two real
 * ecosystem tiles (Shopify, WooCommerce) with "+custom ecosystems", then
 * the agentic-commerce line and a solid lime "See pricing" button.
 */
export function Audience() {
  return (
    <section className="relative overflow-hidden pt-[100px] pb-[100px]">
      {/* Real "7ccdb82a…/YUHQddyA" backdrop (scraped): blue day sky with
          bright clouds above lit green hills, full-bleed with parallax. */}
      <ParallaxBg
        src="/images/ecosystem-hills.png"
        distance={95}
        position="center bottom"
        imgClassName="brightness-[0.92]"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/25 to-background/80"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <FadeUp className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-balance text-[44px] leading-[1.1] text-foreground">
            Built for consumer brands of{" "}
            <em className="text-lime">all sizes.</em>
          </h2>
          <p className="mt-3 text-base leading-6 text-muted-foreground">
            From <span className="text-foreground">small</span> and{" "}
            <span className="text-foreground">mid-market</span> to{" "}
            <span className="text-foreground">enterprise</span> eCommerce, D2C,
            and retail, any consumer business can set up Loopcart AI easily.
          </p>

          {/* Real "Logos" zone (scraped): the Shopify bag (32x35) and the
              WooCommerce bubble (45x26), each centered in a 75px cell, then
              "+custom ecosystems" in 14px lime (orig rgb(216,254,145)). */}
          <div className="mt-[34px] flex items-stretch justify-center gap-[11px]">
            <span className="flex h-[75px] w-[74px] items-center justify-center">
              <img
                src="/images/eco-shopify.svg"
                alt="Shopify"
                className="h-[35px] w-[32px]"
                draggable={false}
              />
            </span>
            <span className="flex h-[75px] w-[76px] items-center justify-center">
              <img
                src="/images/eco-woo.svg"
                alt="WooCommerce"
                className="h-[26px] w-[45px]"
                draggable={false}
              />
            </span>
          </div>
          <p className="mt-[6px] text-[14px] leading-[1.5] tracking-[-0.02em] text-lime">
            +custom ecosystems
          </p>

          <p className="mt-[34px] text-sm text-muted-foreground">
            Let&apos;s stay ahead in the era of agentic commerce.
          </p>
          <a
            href="#"
            className="mt-[33px] inline-flex rounded-lg bg-lime px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-85 active:scale-[0.98]"
          >
            See pricing
          </a>
        </FadeUp>
      </div>
    </section>
  );
}
