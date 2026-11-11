"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  CreditCard,
  LoaderCircle,
} from "lucide-react";
import { FadeUp, Ticker } from "./motion";

/**
 * Real "1:1 hyper-personalization" section, rebuilt from the live scrape:
 * - ONE full-width card holding the value drivers as a vertical accordion
 *   (first item open, lime border) beside the glass agents panel floating
 *   over the real grass backdrop. Each agent card = "agent-0X" label +
 *   lime loading-03 spinner on top, avatar + name + activity below; the
 *   last card is "agent-n" with the scraped typing-dots blink
 *   (1.5s cycle, 0.5s stagger, white -> 5% opacity).
 * - "Optimize your eCommerce conversion funnel with AI" card: the real
 *   funnel visual — groups of 3 avatar circles (53px, layout 20/10-126/10-
 *   72/62 inside a 199x115 cell) falling DOWN at 38.3px/s through a
 *   mask-faded window, lime $ coins (26px, #d8fe91, inset #3c4f18
 *   shadows) falling out the bottom at 35px/s, and the three
 *   abandonment pills stacked 2+1 over the 479x3 gradient line.
 * - "Got a CRM?" card: the four real brand logos ride an infinite
 *   ticker moving RIGHT at 45px/s (measured on the live site) with
 *   edge-fade masks, exactly like the original Framer Ticker.
 */

const valueDrivers = [
  {
    title: "Improve customer relationships",
    desc: "Foster deeper connections with every customer by making them feel heard, not ignored.",
  },
  {
    title: "Orchestrate unique customer journeys",
    desc: "AI picks the right time, channel, and message for every individual based on where they are in their journey.",
  },
  {
    title: "Enhance customer experience",
    desc: "Value your customers' preferences, understand their intent, and tailor every communication in real-time.",
  },
  {
    title: "Increase customer lifetime value",
    desc: "Grow retention and loyalty, reduce churn, and prevent revenue leakage by assisting your customers with agentic AI.",
  },
];

const agents = [
  { id: "agent-01", name: "Emily", role: "analyzing cart hesitation", avatar: "/images/agent-1.jpg" },
  { id: "agent-02", name: "Marcus", role: "detecting wishlist pattern", avatar: "/images/agent-2.jpg" },
  { id: "agent-03", name: "Jony", role: "calculating price sensitivity", avatar: "/images/agent-3.jpg" },
];

const crmLogos = [
  { src: "/images/icons/sales-logo.svg", alt: "Salesforce", w: 102 },
  { src: "/images/icons/hub-logo.svg", alt: "HubSpot", w: 48 },
  { src: "/images/crm-pipedrive.jpg", alt: "Pipedrive", w: 64, round: true },
  { src: "/images/icons/zoho-logo.svg", alt: "Zoho", w: 54 },
];

/* One falling shopper group — exact scraped cell: 199x115, avatars 53px,
   left(20,10) right(126,10) center(72,62). Four copies every 115px. */
function ShopperGroup() {
  return (
    <div className="relative mx-auto h-[115px] w-[199px] shrink-0">
      <ShopperAvatar className="left-[20px] top-[10px]" />
      <ShopperAvatar className="right-[20px] top-[10px]" />
      <ShopperAvatar className="left-[72px] top-[62px]" />
    </div>
  );
}

function ShopperAvatar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute flex h-[53px] w-[53px] items-center justify-center rounded-full bg-[#222222]/60 ${className}`}
      aria-hidden
    >
      {/* filled bust silhouette, like the original "Users" SVG */}
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white/85" aria-hidden>
        <circle cx="12" cy="7.2" r="4.2" />
        <path d="M12 13.2c-4.6 0-8 2.6-8 6.1V21h16v-1.7c0-3.5-3.4-6.1-8-6.1Z" />
      </svg>
    </div>
  );
}

/* One falling-coin group — scraped cell 126x93, coins 26-34px scattered
   like revenue dropping out of the funnel. Four copies every 93px. */
const coinSpots = [
  { left: 46, top: 0, size: 32 },
  { left: 89, top: 18, size: 28 },
  { left: 63, top: 50, size: 34 },
  { left: 7, top: 12, size: 30 },
  { left: 24, top: 49, size: 26 },
];

function CoinGroup() {
  return (
    <div className="relative mx-auto h-[93px] w-[126px] shrink-0">
      {coinSpots.map((c, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center rounded-full bg-[#d8fe91]"
          style={{
            left: c.left,
            top: c.top,
            width: c.size,
            height: c.size,
            boxShadow:
              "rgba(60,79,24,0.72) 0 0.6px 1.1px -1.25px inset, rgba(60,79,24,0.64) 0 2.3px 4.1px -2.5px inset, rgba(60,79,24,0.25) 0 10px 18px -3.75px inset",
          }}
          aria-hidden
        >
          <span
            className="font-semibold leading-none text-[#3c4f18]"
            style={{ fontSize: Math.round(c.size * 0.52) }}
          >
            $
          </span>
        </div>
      ))}
    </div>
  );
}

const funnelChips = [
  { icon: Search, label: "Browse abandonment" },
  { icon: ShoppingCart, label: "Cart abandonment" },
  { icon: CreditCard, label: "Checkout abandonment" },
];

function FunnelChip({ icon: Icon, label }: { icon: typeof Search; label: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-black/40 px-3 text-[13px] text-foreground/90 backdrop-blur-md">
      <Icon className="h-4 w-4 text-lime" strokeWidth={1.75} aria-hidden />
      {label}
    </span>
  );
}

export function Agents() {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();

  return (
    <section className="relative pt-[150px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <FadeUp className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-balance text-[44px] leading-[1.1] text-foreground">
            Combine customer lifecycle marketing with{" "}
            <em className="text-lime">1:1 hyper-personalization</em>
          </h2>
          <p className="mt-8 text-base leading-6 text-muted-foreground">
            Growing eCommerce brands tailor engagement for every customer, from
            first-time visitor to loyal shopper. Loopcart AI accelerates that
            growth automatically with its native Large Event Model,{" "}
            <span className="text-lime">Aurora</span>.
          </p>
        </FadeUp>

        {/* ONE card: accordion (left) + agents panel (right) */}
        <FadeUp delay={0.05} className="mt-[40px]">
          <div className="overflow-hidden rounded-3xl border border-white/8 bg-card/50 dot-grid">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-10">
                {/* Brand glyph chip, like the original card's logo mark */}
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/10 font-display text-2xl text-lime">
                  l
                </span>
                <h3 className="mt-5 font-display text-balance text-3xl leading-snug text-foreground">
                  Unlock the core value drivers for successful D2C brands
                </h3>

                <div className="mt-8 space-y-3">
                  {valueDrivers.map((value, i) => {
                    const isOpen = open === i;
                    return (
                      <div
                        key={value.title}
                        className={`rounded-xl border transition-colors duration-300 ${
                          isOpen
                            ? "border-lime/60 bg-lime/[0.04]"
                            : "border-white/10 bg-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpen(i)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-4 px-5 py-[17px] text-left"
                        >
                          <span className="text-[15px] font-medium text-foreground">
                            {value.title}
                          </span>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isOpen
                                ? "border-lime/60 text-lime"
                                : "border-white/20 text-foreground/60"
                            }`}
                            aria-hidden
                          >
                            {isOpen ? (
                              <Minus className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.32, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-muted-foreground">
                                {value.desc}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agents panel: glass stack floating over the real grass */}
              <div className="relative flex min-h-[480px] items-center justify-center overflow-hidden border-t border-white/8 lg:border-l lg:border-t-0">
                <div
                  className="pointer-events-none absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url(/images/agents-panel.png)" }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/45"
                  aria-hidden
                />
                {/* The 1:1 "Images" panel enters with the scraped "bi"
                    variant: opacity 1, scale 0 -> 1, tween delay .1s
                    duration .7s, at 50% visibility, once. */}
                <motion.div
                  initial={{ opacity: 1, scale: reduce ? 1 : 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: 0.1, duration: 0.7, ease: [0.12, 0.23, 0.17, 0.99] }}
                  className="relative w-[358px] max-w-[92%]"
                >
                  <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 shadow-2xl backdrop-blur-xl">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="rounded-xl bg-black/30 p-3 backdrop-blur-[5px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium tracking-[-0.04em] text-white">
                            {agent.id}
                          </span>
                          <LoaderCircle
                            className="h-[17px] w-[17px] text-lime"
                            strokeWidth={2}
                            aria-hidden
                          />
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <img
                            src={agent.avatar}
                            alt=""
                            className="h-6 w-6 shrink-0 rounded-full border border-white/15 object-cover"
                            draggable={false}
                          />
                          <span className="text-[15px] font-medium text-foreground">
                            {agent.name}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {agent.role}
                          </span>
                        </div>
                      </div>
                    ))}
                    {/* agent-n: scraped typing dots — 1.5s cycle, 0.5s stagger */}
                    <div className="flex h-11 items-center justify-between rounded-xl bg-black/30 px-3 backdrop-blur-[5px]">
                      <span className="text-xs font-medium tracking-[-0.04em] text-white">
                        agent-n
                      </span>
                      <span className="flex items-center gap-[3px]" aria-hidden>
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="agent-dot h-1.5 w-1.5 rounded-full bg-white"
                            style={{ animationDelay: `${i * 0.5}s` }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Funnel + CRM cards side by side */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <FadeUp className="h-full min-w-0">
            <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/8 bg-card/50 p-8 text-center sm:p-10">
              <h3 className="font-display text-balance text-2xl leading-snug text-foreground">
                Optimize your <em className="text-lime">eCommerce conversion funnel</em>{" "}
                with AI
              </h3>

              {/* Funnel visual — scraped: shoppers fall in, coins fall out */}
              <div className="relative mt-6 h-[354px] overflow-hidden dot-grid">
                {/* Line 65: 479x3 gradient line at the funnel neck */}
                <div
                  className="absolute left-1/2 top-[286px] z-0 h-[3px] w-[479px] max-w-[94%] -translate-x-1/2 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(204,204,204,0.6), rgba(204,204,204,0))",
                  }}
                  aria-hidden
                />

                {/* Shoppers falling into the funnel — 38.3px/s down */}
                <Ticker
                  axis="y"
                  dir={-1}
                  duration={12}
                  className="absolute inset-x-0 top-0 z-0 h-[292px] [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_62%,transparent_96%)]"
                  innerClassName="mx-auto"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <ShopperGroup key={i} />
                  ))}
                </Ticker>

                {/* Coins falling out — 35px/s down */}
                <Ticker
                  axis="y"
                  dir={-1}
                  duration={10.6}
                  className="absolute inset-x-0 bottom-0 z-0 h-[130px] [mask-image:linear-gradient(to_top,transparent,black_30%,black)]"
                  innerClassName="mx-auto"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <CoinGroup key={i} />
                  ))}
                </Ticker>

                {/* The funnel neck: pills stacked 2+1 */}
                <div className="absolute left-1/2 top-[287px] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <FunnelChip icon={Search} label="Browse abandonment" />
                    <FunnelChip icon={ShoppingCart} label="Cart abandonment" />
                  </div>
                  <FunnelChip icon={CreditCard} label="Checkout abandonment" />
                </div>
              </div>

              <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                <span className="text-lime">Guide every customer forward</span>{" "}
                with personalized messages tailored to their journey. Turn every
                touchpoint, scroll, and micro-interaction into revenue.
              </p>
            </div>
          </FadeUp>

          {/* CRM card — real color logos on an infinite rightward ticker */}
          <FadeUp delay={0.1} className="h-full min-w-0">
            <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/8 bg-card/50 p-8 text-center sm:p-10">
              <h3 className="font-display text-balance text-2xl leading-snug text-foreground">
                Got a <em className="text-lime">CRM?</em> Connect it with
                Loopcart AI and turn your data into revenue.
              </h3>
              <div className="flex flex-1 items-center">
                <Ticker
                  dir={-1}
                  duration={10}
                  className="h-[110px] w-full [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
                  innerClassName="gap-[46px] pr-[46px]"
                >
                  {crmLogos.map((logo) => (
                    <img
                      key={logo.alt}
                      src={logo.src}
                      alt={logo.alt}
                      style={{ width: logo.w }}
                      className={`h-auto shrink-0 ${logo.round ? "rounded-lg" : ""}`}
                      draggable={false}
                    />
                  ))}
                </Ticker>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Engage a larger customer base by bringing past customer data
                into your campaigns.{" "}
                <span className="text-lime">
                  Make future interactions more refined
                </span>{" "}
                with behavioral intelligence.
              </p>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
