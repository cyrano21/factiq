"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Ticker } from "./motion";

/**
 * Appear animations scraped from Framer's __framer__appearAnimationsContent
 * (all six hero entries share the exact same transition):
 *   badge  dmpn3l  opacity 0.001->1, scale 0.9->1
 *   h1     136841q opacity 0.001->1, scale 0.9->1
 *   sub    154fnc6 opacity 0.001->1, scale 0.9->1
 *   ctas   yb5ny9  opacity 0.001->1, scale 0.9->1
 *   logos  1jx7x66 opacity 0.001->1, scale 0.9->1, y 40->0
 *   hill   1qtdq0a scale 0.9->1, y 40->0  (no opacity — stays visible)
 *   transition: tween, delay 0.2s, duration 1s,
 *   ease cubic-bezier(0.12, 0.23, 0.17, 0.99) — fired on page load.
 */
const APPEAR_EASE: [number, number, number, number] = [0.12, 0.23, 0.17, 0.99];
const APPEAR_TRANSITION = { delay: 0.2, duration: 1, ease: APPEAR_EASE } as const;

/**
 * GEOMETRY — scraped live from the original at a 1440px viewport (section
 * "Hero section", h = 1260px, overflow hidden, vertical fade mask black
 * 75% -> transparent 97%). One single hero holds the sky, the copy, the
 * logo strip, the floating analytics dashboard AND the grass hill that
 * overlaps the dashboard's bottom edge:
 *   sky        top -130px, 1440x1230, opacity .56 (parent), mask 11% -> 88%
 *   badge      top 140
 *   h1         top 189, font-size 56px, one line, max-width 1089
 *   subtitle   top 267, font-size 16
 *   buttons    top 323, height 44
 *   no-credit  top 383, font-size 14
 *   logos      top 497, height 35 (one 2220x35 strip image, drifts right
 *              over 41.18s, no edge mask — logos are cut at the viewport)
 *   dashboard  top 559, 948x538, radius 14, z above the sky
 *   hill       top 856 (780 under 810px), width 100% of the page — EDGE TO
 *              EDGE at every viewport (CSS: position:absolute; left:0;
 *              width:100%; aspect-ratio 2.748), z above the dashboard (its
 *              crest hides the dashboard's bottom edge)
 *
 * SCROLL EFFECTS (measured on the live original, linear over the GLOBAL
 * page scroll progress p — full effect at document end, ~8360px):
 *   the whole "Logos" group (logo strip + dashboard) sinks   y  0 -> +370
 *   the hill "bg" rises and zooms  scale 1 -> 1.3, y         0 -> -310
 *   the sky is STATIC (transform none measured at any scroll).
 * As the user scrolls, the dashboard sinks while the hill scales up over
 * it — the crest progressively masks the dashboard's charts, exactly like
 * the original.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Global page scroll progress (window, 0 -> 1 over the whole document),
  // the same driver Framer's onScroll transform effects measured on the
  // original (completion at documentHeight - viewportHeight).
  const { scrollYProgress } = useScroll();
  const groupY = useTransform(scrollYProgress, [0, 1], [0, 370]);
  const hillScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const hillY = useTransform(scrollYProgress, [0, 1], [0, -310]);
  const zero = useTransform(scrollYProgress, () => (reduce ? 1 : 0));
  const one = useTransform(scrollYProgress, () => (reduce ? 0 : 1));
  const safeGroupY = reduce ? zero : groupY;
  const safeHillScale = reduce ? one : hillScale;
  const safeHillY = reduce ? zero : hillY;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        height: "1260px",
        maskImage: "linear-gradient(to bottom, black 75%, transparent 97%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 75%, transparent 97%)",
      }}
    >
      {/* Scraped sky: same photo as the original (exn4BQ6x, verified
          pixel-identical), rendered at 50% opacity over the black page
          (tuned against the original's rendered bands: the real page reads
          ~7% darker than a plain .56 layer), fading in through an 11% ->
          88% vertical mask. STATIC — the original applies no scroll
          transform to the sky (measured transform:none at any scroll). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 opacity-[0.48]"
        style={{
          top: "-130px",
          height: "1230px",
          maskImage: "linear-gradient(to bottom, transparent 11%, black 88%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 11%, black 88%)",
        }}
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-sky.jpg)" }}
        />
      </div>

      {/* Hero copy — every element appears exactly like the scraped
          appearAnimation entries: opacity 0.001 -> 1 + scale 0.9 -> 1,
          delay 0.2s, duration 1s, tween ease(0.12,0.23,0.17,0.99), all
          simultaneously on load (no stagger in the original). Absolute
          tops tuned to the scraped values (badge 140, h1 189, p 267,
          buttons 323, no-credit 383). The announcement bar (48px) and
          nav (64px) are fixed overlays, so the hero starts at page y=0. */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-[140px] text-center sm:px-6">
        <motion.span
          initial={{ opacity: 0.001, scale: reduce ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={APPEAR_TRANSITION}
          className="inline-flex h-[33px] items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1.5 pr-4 text-xs text-foreground/80 backdrop-blur"
        >
          <span
            className="flex h-[27px] w-[27px] items-center justify-center overflow-hidden rounded-full"
            aria-hidden
          >
            {/* Real animated HF0 logo (scraped asset) */}
            <img
              src="/images/hf0-badge.gif"
              alt=""
              className="h-[27px] w-[27px] object-cover"
              draggable={false}
            />
          </span>
          Backed by HF0
        </motion.span>

        <motion.h1
          initial={{ opacity: 0.001, scale: reduce ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={APPEAR_TRANSITION}
          className="font-display mt-4 max-w-[1089px] text-balance text-[clamp(30px,3.89vw,56px)] leading-[1.1] text-foreground"
        >
          Turn more <em className="text-lime">eCommerce</em> shoppers into
          repeat customers
        </motion.h1>

        <motion.p
          initial={{ opacity: 0.001, scale: reduce ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={APPEAR_TRANSITION}
          className="mt-4 max-w-[1089px] text-balance text-[16px] leading-6 text-foreground/70"
        >
          Our platform engages with online shopper to increase your sales
          across <span className="text-lime">email</span>,{" "}
          <span className="text-lime">SMS</span>,{" "}
          <span className="text-lime">push</span>,{" "}
          <span className="text-lime">WhatsApp</span>, and{" "}
          <span className="text-lime">AI voice calls</span> —all from one
          place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0.001, scale: reduce ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={APPEAR_TRANSITION}
          className="mt-8 flex h-11 flex-col items-center gap-3 sm:flex-row"
        >
          <a
            href="#"
            className="flex h-11 items-center rounded-lg bg-lime px-8 text-[15px] font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-85 active:scale-[0.98]"
          >
            Start free
          </a>
          <a
            href="#"
            className="flex h-11 items-center rounded-lg border border-white/10 bg-white/5 px-8 text-[15px] font-medium text-foreground backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.98]"
          >
            Request demo
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0.001, scale: reduce ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={APPEAR_TRANSITION}
          className="mt-4 text-sm text-foreground/50"
        >
          No credit card required.
        </motion.p>

        {/* "Logos" group — in the original, ONE group (framer-1jx7x66)
            holds the logo strip AND the dashboard. It appears on load
            (opacity .001 -> 1, scale .9 -> 1, y 40 -> 0, delay .2s, 1s)
            and then SINKS with page scroll: y 0 -> +370 over the global
            scroll progress — the dashboard dives into the hill while the
            hill rises above it. Outer div = scroll sink, inner div =
            load appear (Framer sums both transforms on one element). */}
        <motion.div style={{ y: safeGroupY }} className="w-full will-change-transform">
          <motion.div
            initial={{ opacity: 0.001, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={APPEAR_TRANSITION}
            className="flex flex-col items-center"
          >
            {/* Logo strip — the real page uses one wide image of logos
                (5yqgcfTo, displayed 2220x35), not styled text. It drifts
                rightward in a seamless 41.18s loop with no edge mask. */}
            <div className="mt-[93px] w-full">
              <Ticker duration={41.18} dir={-1}>
                <img
                  src="/images/logos-ticker.svg"
                  alt="Trusted by teams at WeDevs, T2, OLAY, Dhaka Bank, BAT, bKash and Airwallex"
                  className="h-[35px] w-auto"
                  draggable={false}
                />
              </Ticker>
            </div>

            {/* Floating analytics dashboard — the real "Marko dash" asset
                (aOsPrOblg, 3950x2241 with alpha, verified pixel-identical),
                displayed 948px wide with a 14px radius. Appears with the
                group on load, then sinks into the hill on scroll (the
                scroll transform lives on the parent group, like the
                original). */}
            {/* Widths = the scraped `sizes` attribute verbatim:
                >=1200px 948px, 810-1199px calc(100vw - 80px),
                <=809px calc(100vw - 40px). */}
            <img
              src="/images/dashboard-analytics.png"
              alt="Loopcart analytics dashboard — revenue attribution by channel"
              draggable={false}
              className="mt-[27px] block w-[calc(100vw-40px)] min-[810px]:w-[calc(100vw-80px)] min-[1200px]:w-[948px] rounded-[14px]"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Grass hill "bg" (framer-1qtdq0a) — real cutout PNG (uoQWh0Th,
          4320x1572 source, verified pixel-identical), rendered EXACTLY like
          the scraped CSS rule: position:absolute; top:856px (780px under
          810px); left:0; width:100% — the hill spans the full page width
          edge-to-edge at EVERY viewport (an earlier 1462px cap was a
          mid-scroll measurement with scale 1.0153 already applied — wrong).
          z-index ABOVE the dashboard so its crest hides the dashboard's
          bottom edge. Appears on load with scale .9 -> 1 and y 40 -> 0 (no
          opacity change), then rises and zooms with page scroll: scale
          1 -> 1.3, y 0 -> -310 over the global scroll progress — covering
          the sinking dashboard's charts, exactly like the original. Outer
          div = scroll effect, inner div = load appear (Framer sums both
          transforms on one element). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[856px] z-20 max-[809px]:top-[780px]"
      >
        <motion.div
          style={{ y: safeHillY, scale: safeHillScale }}
          className="will-change-transform"
        >
          <motion.div
            initial={{ y: reduce ? 0 : 40, scale: reduce ? 1 : 0.9 }}
            animate={{ y: 0, scale: 1 }}
            transition={APPEAR_TRANSITION}
          >
            <img
              src="/images/hero-hill.png"
              alt=""
              className="block h-auto w-full"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
