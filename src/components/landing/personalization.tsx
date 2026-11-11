"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Boxes, Activity, IdCard, LineChart, ShoppingBag, BrainCircuit, Wand2, Network } from "lucide-react";
import { FadeUp, ParallaxBg } from "./motion";

/**
 * Real "Personalization engine" section (scraped verbatim): title + intro,
 * then a THREE-CARD carousel with round lime arrows (the original shows
 * Composable CDP / Real-time behavioral analysis / Unified customer
 * profiles on the first view). The eight capabilities are spread across
 * three pages in the original scrape order.
 */
const features = [
  {
    icon: Boxes,
    title: "Composable CDP",
    desc: "MarkTag, our built-in composable CDP, enables real-time personalization and omnichannel journeys.",
  },
  {
    icon: Activity,
    title: "Real-time behavioral analysis",
    desc: "Tracks user actions and infer intent, price sensitivity, and category affinity in real time.",
  },
  {
    icon: IdCard,
    title: "Unified customer profiles",
    desc: "Treats the same customer consistently across channels by preserving contextual data into a single profile.",
  },
  {
    icon: LineChart,
    title: "Reporting & attribution",
    desc: "Dashboards track and analyze conversion rate, AOV, engagement, email/SMS CTR, and more along with attributed revenue.",
  },
  {
    icon: ShoppingBag,
    title: "Smart product recommendations",
    desc: "Dynamically recommends the right product to the right customer through the right channel.",
  },
  {
    icon: BrainCircuit,
    title: "Predictive engine",
    desc: "Uses AI & ML to identify users by predicted behavior and score for likelihood to convert, churn, or respond to specific offers.",
  },
  {
    icon: Wand2,
    title: "Dynamic content with GenAI",
    desc: "Swaps banners, hero blocks, products, CTAs, and section layouts by user intent.",
  },
  {
    icon: Network,
    title: "Cross-channel context-awareness",
    desc: "Monitors every customer interaction across channels, and launches campaigns accordingly.",
  },
];

const PAGE = 3;
const pages: (typeof features)[] = [];
for (let i = 0; i < features.length; i += PAGE) pages.push(features.slice(i, i + PAGE));

export function Personalization() {
  const [page, setPage] = useState(0);

  return (
    <section className="relative overflow-hidden pt-[150px] pb-[150px]">
      {/* Real "BG 2" backdrop (scraped asset) — rendered full-bleed behind
          the whole section with object-position 50.9% 61%. */}
      <ParallaxBg
        src="/images/personalization-bg.jpg"
        distance={85}
        position="50.9% 61%"
        imgClassName="brightness-[0.72] saturate-110"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/55 to-background"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <FadeUp className="mx-auto max-w-[900px] text-center">
          <h2 className="font-display text-balance text-[44px] leading-[1.1] text-foreground">
            Personalization engine for{" "}
            <em className="text-lime">D2C brands</em>
          </h2>
          <p className="mx-auto mt-8 max-w-[900px] text-base leading-6 text-muted-foreground">
            Customer engagement gets better when you recognize each
            person&apos;s micro-behaviors. Loopcart AI helps you get{" "}
            <span className="text-lime">more out of personalized engagement</span>{" "}
            than traditional segmentation and batch-and-blast campaigns ever
            can.
          </p>
        </FadeUp>

        {/* 3-card carousel page with round lime arrows below-right —
            scraped zone: cards 165px + arrows, 234px total, 60px below
            the subtitle */}
        <div className="mt-[40px]">
          <div className="relative min-h-[165px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid gap-4 sm:grid-cols-3"
              >
                {pages[page].map((feature) => (
                  <article
                    key={feature.title}
                    className="h-full rounded-2xl border border-white/10 bg-black/55 p-6 backdrop-blur transition-colors duration-300 hover:border-lime/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime/10 text-lime">
                        <feature.icon className="h-4.5 w-4.5" aria-hidden />
                      </div>
                      <h3 className="text-[15px] font-semibold leading-snug text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="mt-3.5 text-[13px] leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </article>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-[29px] flex items-center justify-end gap-3">
            <button
              type="button"
              aria-label="Previous capabilities"
              onClick={() => setPage((page - 1 + pages.length) % pages.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-lime/50 bg-lime/[0.08] text-lime transition-all duration-300 hover:bg-lime hover:text-primary-foreground active:scale-95"
            >
              <ArrowLeft className="h-4.5 w-4.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next capabilities"
              onClick={() => setPage((page + 1) % pages.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-lime/50 bg-lime/[0.08] text-lime transition-all duration-300 hover:bg-lime hover:text-primary-foreground active:scale-95"
            >
              <ArrowRight className="h-4.5 w-4.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
