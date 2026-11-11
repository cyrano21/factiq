"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CountUp, FadeUp, FRAMER_SPRING } from "./motion";

/**
 * Real "Testimonials" carousel (scraped): ONE full-width case-study card
 * at a time — landscape backdrop fading into the card, headline, quote,
 * person, then a 3-stat row divided by hairlines — navigated by round
 * lime arrow buttons at the bottom right (the original "Left / Right"
 * controls). Two scraped slides: Carnival Internet and Eastern Pickles.
 */
const slides = [
  {
    company: "Carnival Internet",
    bg: "/images/case-bg-1.png",
    profile: "/images/story-profile-1.png",
    headline: "From 12% to 43% Cart Recovery for Carnival Internet",
    quote:
      "Loopcart's AI called our customers who abandoned carts within 30 seconds. When SMS failed, it switched to WhatsApp. When that failed, it made a voice call with a personalized offer. We went from sending 2 generic emails to having actual conversations with customers.",
    note: null as string | null,
    person: "Alec Paterson",
    role: "Director, Dotlines UK",
    stats: [
      {
        value: 43,
        suffix: "%",
        decimals: 0,
        label: "cart recovery vs. 12% industry baseline",
      },
      {
        value: 67,
        suffix: "%",
        decimals: 0,
        label: "mobile conversion lift through behavioral intent prediction",
      },
      {
        value: 2.4,
        suffix: "s",
        decimals: 1,
        label: "response time: AI predicts exit intent",
      },
    ],
  },
  {
    company: "Eastern Pickles",
    bg: "/images/case-bg-3.png",
    profile: "/images/story-profile-2.png",
    headline: "From 2% to 10.4% Cart Recovery for Eastern Pickles",
    quote:
      "Our customers think we're psychic. They browse our tamarind pickles at midnight and get a personalized WhatsApp about our grandmother's recipe. It's like having our best salesperson available 24/7.",
    note: "Average response time: 28 seconds From abandonment to first contact",
    person: "Sohel Aman",
    role: "Head of Marketing, Eastern Pickles",
    stats: [
      {
        value: 5.2,
        suffix: "X",
        decimals: 1,
        label: "Increase in cart recovery rate (from 2% to 10.4%)",
      },
      {
        value: 2.8,
        suffix: "M",
        decimals: 1,
        label: "Additional revenue recovered in 6 months",
      },
      {
        value: 67,
        suffix: "%",
        decimals: 0,
        label: "Of customers prefer WhatsApp conversations over email",
      },
    ],
  },
];

export function Stories() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <section className="relative pt-[59px] pb-[72px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeUp>
          <h2 className="font-display text-balance text-center text-[44px] leading-[1.1] text-foreground">
            Stories from brands using{" "}
            <em className="text-lime">Loopcart AI</em>
          </h2>
        </FadeUp>

        <FadeUp delay={0.08} className="mt-[31px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-card/50">
            <AnimatePresence mode="wait">
              <motion.article
                key={index}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative"
              >
                {/* Landscape backdrop fading into the card */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[62%] bg-cover bg-top"
                  style={{ backgroundImage: `url(${slide.bg})` }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-card/85 to-card"
                  aria-hidden
                />

                <div className="relative px-8 pt-9 sm:px-12">
                  <p className="font-display text-balance text-2xl leading-snug text-foreground sm:text-[28px]">
                    {slide.headline}
                  </p>

                  <blockquote className="mt-4 max-w-4xl border-l-2 border-lime/40 pl-4 text-[14.5px] leading-relaxed text-foreground/85">
                    &ldquo;{slide.quote}&rdquo;
                  </blockquote>

                  {slide.note && (
                    <p className="mt-3 inline-flex rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs text-foreground/75 backdrop-blur">
                      {slide.note}
                    </p>
                  )}

                  <figcaption className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <img
                      src={slide.profile}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-white/15 object-cover"
                      draggable={false}
                    />
                    <span>
                      <span className="font-medium text-foreground/80">
                        {slide.person}
                      </span>{" "}
                      · {slide.role}
                    </span>
                  </figcaption>

                  {/* 3-stat row with hairline dividers, like the original */}
                  <div className="mt-10 grid gap-8 border-t border-white/8 py-9 sm:grid-cols-3 sm:gap-0">
                    {slide.stats.map((stat, i) => (
                      <div
                        key={stat.label}
                        className={
                          i === 0 ? "" : "sm:border-l sm:border-white/8 sm:pl-8"
                        }
                      >
                        <p className="font-display text-4xl text-lime">
                          <CountUp
                            value={stat.value}
                            decimals={stat.decimals}
                            suffix={stat.suffix}
                          />
                        </p>
                        <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          {/* Round lime arrows at the bottom right — the real controls */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              aria-label="Previous story"
              onClick={() =>
                setIndex((index - 1 + slides.length) % slides.length)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-lime/50 bg-lime/[0.08] text-lime transition-all duration-300 hover:bg-lime hover:text-primary-foreground active:scale-95"
            >
              <ArrowLeft className="h-4.5 w-4.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next story"
              onClick={() => setIndex((index + 1) % slides.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-lime/50 bg-lime/[0.08] text-lime transition-all duration-300 hover:bg-lime hover:text-primary-foreground active:scale-95"
            >
              <ArrowRight className="h-4.5 w-4.5" aria-hidden />
            </button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
