"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FadeUp } from "./motion";

/**
 * Real "Behavior-triggered emails" section, rebuilt from the scrape and
 * live measurement of the original (markopolo.ai, 1440px viewport).
 *
 * LAYOUT (measured): header (h2 44px + subtitle), then a "Scroll Container"
 * holding three 900x400 cards on 460px slots (400 + 60 gap, container
 * 1320px). Each card is position:sticky at top 120 / 140 / 160px.
 *
 * SCROLL EFFECT (measured on the running original, linear, no spring):
 * a card keeps scale 1 while it approaches and pins; once its slot top
 * crosses the viewport top it shrinks 1 -> 0.9, and all three cards reach
 * exactly 0.9 together at deck bottom + 155px of scroll, then hold.
 *   card1: 1.0 @3775 -> 0.9 @5250   card2: 1.0 @4235 -> 0.9 @5250
 *   card3: 1.0 @4695 -> 0.9 @5250   (transform-origin center)
 * The cards are translucent glass: backdrop-blur(8px) over
 * linear-gradient(90deg, #d8fe911a 0%, #000 58%) — the covered card's
 * title shines through the covering card as a soft streak (measured).
 *
 * CARD CONTENT (scraped verbatim, including the original's own typo
 * "identifiy" and hyphenated "Offer-responsive"):
 *   Card 1 "Step in before hesitation becomes abandonment" — 4 serif
 *          behavior chips, lime "High Intent Detected / Purchase
 *          probability: 87% / 06:00 PM" pill, Athena message row
 *          "Still thinking it over?" + 08:00 PM (renamed Aurora).
 *   Card 2 "Reach the right shopper, on the right channel, at the right
 *          time" — profile header (Scottie, User since Oct 8, 2024), lime
 *          pill 08:00 PM, dashed tree down to 4 channel icons
 *          (Telegram / Mail / WhatsApp / chat).
 *   Card 3 "Save incentives for shoppers who actually need them" — Shopper
 *          A/B chip columns, lime "Predicted purchase: 91%" + 10/12 lime
 *          squares, orange "Predicted lift: +24%" + 4/12 lime squares,
 *          lime "10% OFFER" pill under Shopper B.
 */

/** Slot pitch and card size measured on the original (900x400 on 460). */
const CARD_H = 400;
const SLOT_GAP = 60;
/** Shared shrink end: deck bottom + 155px (measured on the original). */
const DECK_END_MARGIN = 155;

/** The deck element, so each card can locate the shared shrink end. */
const DeckRefContext = createContext<React.RefObject<HTMLDivElement | null>>({
  current: null,
});

/**
 * One card of the sticky deck. The shrink is driven by the WINDOW scrollY
 * between two absolute anchors measured from the live layout (slot top and
 * deck bottom + 155) — the same linear mapping measured on the original.
 */
function StackCard({
  children,
  offset,
  index,
}: {
  children: ReactNode;
  offset: number;
  index: number;
}) {
  const deckRef = useContext(DeckRefContext);
  const slotRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [startY, setStartY] = useState(0);
  const [endY, setEndY] = useState(1000);

  useLayoutEffect(() => {
    const measure = () => {
      const slot = slotRef.current;
      const deck = deckRef.current;
      if (!slot || !deck) return;
      setStartY(slot.getBoundingClientRect().top + window.scrollY);
      setEndY(
        deck.getBoundingClientRect().bottom + window.scrollY + DECK_END_MARGIN,
      );
    };
    measure();
    // Re-measure after fonts/images settle the layout.
    const t1 = setTimeout(measure, 600);
    const t2 = setTimeout(measure, 2000);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
    };
  }, [deckRef]);

  const scale = useTransform(
    scrollY,
    [startY, Math.max(startY + 400, endY)],
    reduce ? [1, 1] : [1, 0.9],
    { clamp: true },
  );

  return (
    <div
      ref={slotRef}
      className={`relative z-[3] lg:sticky ${index < 2 ? "lg:mb-[60px]" : ""}`}
      style={{ top: `${offset}px` }}
    >
      <motion.div
        style={{ scale, transformOrigin: "center center" }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** The real 900x400 translucent card shell (gradient + backdrop blur).
 *  The scraped background is translucent on its left 58% — the covered
 *  card's content shines through it (the soft streak measured on the
 *  original) — and opaque black to the right, where the panel sits. */
function CardShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto h-auto min-h-[400px] w-[min(900px,calc(100vw-32px))] overflow-hidden rounded-[14px] border border-[#222] backdrop-blur-[8px] lg:h-[400px] lg:min-h-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(216,254,145,0.10) 0%, #000 58%)",
      }}
    >
      {/* Real "Pattern Texture" grain — measured 634px wide over the left
          gradient zone at opacity 0.4. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[634px] bg-repeat opacity-40"
        style={{ backgroundImage: "url(/images/pattern-texture.png)" }}
      />
      {children}
    </div>
  );
}

/** Left text block — measured: x40, vertically centered, H5 16px Booton
 *  Medium (one line at 1440), letter-spacing -0.32px, subtitle 15px/24. */
function CardText({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:w-[445px] lg:shrink-0 lg:pl-10 lg:pr-10">
      <h3 className="text-[16px] font-medium leading-[24px] tracking-[-0.32px] text-foreground">
        {title}
      </h3>
      <p className="mt-[6px] max-w-[324px] text-[15px] leading-[24px] text-foreground/60">
        {sub}
      </p>
    </div>
  );
}

/** Serif behavior chip (the original renders these in its display serif). */
function Chip({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`font-display inline-flex h-[22px] items-center rounded-full bg-black/45 px-3 text-[11px] leading-none text-foreground/90 backdrop-blur-sm ${className}`}
    >
      {label}
    </span>
  );
}

/** Lime "High Intent Detected" pill — measured 272x62 with 32px icon. */
function HighIntentPill({ time }: { time: string }) {
  return (
    <div className="flex h-[62px] w-[272px] items-center gap-3 rounded-[12px] bg-lime pl-[10px] pr-[14px]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
          <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold leading-[17px] text-[#141703]">
          High Intent Detected
        </span>
        <span className="block text-[12px] leading-[15px] text-[#141703]/75">
          Purchase probability: 87%
        </span>
      </span>
      <span className="shrink-0 text-[9px] font-medium text-[#141703]/70">
        {time}
      </span>
    </div>
  );
}

/** Right glass panel — measured 405x340, inset 30px, radius 12. */
function CardPanel({
  src,
  children,
}: {
  src: string;
  children: ReactNode;
}) {
  return (
    <div className="relative mx-4 mb-6 h-[340px] shrink-0 overflow-hidden rounded-[12px] lg:absolute lg:right-[30px] lg:top-[30px] lg:m-0 lg:h-[340px] lg:w-[405px]">
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div className="relative flex h-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/** 306px content module centered in the panel (measured width). */
function PanelInner({ children }: { children: ReactNode }) {
  return <div className="w-[306px]">{children}</div>;
}

/* ---------------------------------- card 1 --------------------------------- */

const card1Chips = [
  { label: "Compared variants", cls: "absolute left-[70px] top-[18px]" },
  { label: "2x viewed size guide", cls: "absolute left-[198px] top-[40px]" },
  {
    label: "Hovered \u2018Add to Cart\u2019 4 times",
    cls: "absolute left-[19px] top-[75px]",
  },
  {
    label: "Scrolled price reviews twice",
    cls: "absolute left-[234px] top-[75px]",
  },
];

function Card1Panel() {
  return (
    <CardPanel src="/images/predict-card-1.jpg">
      <PanelInner>
        <div className="relative h-[276px]">
          {/* Coordinates are content-group relative (the measured 306px
              group starts 32px inside the panel). */}
          {card1Chips.map((chip) => (
            <span key={chip.label} className={`absolute ${chip.cls}`}>
              <Chip label={chip.label} />
            </span>
          ))}

          {/* Lime pill — group-relative y 117 (panel y 149) */}
          <div className="absolute left-[17px] top-[117px]">
            <HighIntentPill time="06:00 PM" />
          </div>

          {/* Message row — measured 306x79, group-relative y 197 */}
          <div className="absolute left-0 top-[197px] h-[79px] w-[306px] overflow-hidden rounded-[10px] border border-white/8 bg-black/45 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 pt-3 text-[11px] text-foreground/55">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2" aria-hidden>
                  <rect x="4" y="5" width="14" height="12" rx="2" />
                </svg>
                Aurora
              </span>
              <span>08:00 PM</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-4">
              <span className="text-[13px] text-foreground/85">
                Still thinking it over?
              </span>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-lime" strokeWidth="2" aria-hidden>
                <path d="m3 13 4 4L15 9" />
                <path d="m11 13 4 4L23 9" />
              </svg>
            </div>
          </div>
        </div>
      </PanelInner>
    </CardPanel>
  );
}

/* ---------------------------------- card 2 --------------------------------- */

const card2Channels = [
  {
    label: "Telegram",
    bg: "bg-[#229ED9] rounded-full",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
        <path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7L18.2 6.6c.4-.3-.1-.5-.6-.2L7.3 13l-4.5-1.4c-1-.3-1-1 .2-1.4L20.6 3.2c.8-.3 1.5.2 1.3 1.4Z" />
      </svg>
    ),
  },
  {
    label: "Email",
    bg: "bg-[#1d1d1d] rounded-[10px]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    bg: "bg-[#25D366] rounded-full",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.3.6-.7.9-.5 1.2.7 1.2 1.6 2 2.8 2.6.3.2.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.4 0 .1 0 .6-.3 1.1Z" />
      </svg>
    ),
  },
  {
    label: "Chat",
    bg: "bg-[#1d1d1d] rounded-[10px]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8" aria-hidden>
        <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" />
      </svg>
    ),
  },
];

function Card2Panel() {
  return (
    <CardPanel src="/images/predict-card-2.jpg">
      <PanelInner>
        <div className="relative h-[276px]">
          {/* Profile header — measured 306x79 at y 32 */}
          <div className="flex h-[79px] w-[306px] items-center gap-3 rounded-[10px] border border-white/8 bg-black/35 px-4 backdrop-blur-sm">
            <img
              src="/images/predict-avatar.png"
              alt=""
              draggable={false}
              className="h-12 w-12 shrink-0 rounded-full object-cover object-top"
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] leading-[14px] text-foreground/50">
                Username
              </span>
              <span className="block text-[13px] font-semibold leading-[18px] text-foreground">
                Scottie
              </span>
            </span>
            <span className="text-right text-[10px] leading-[14px] text-foreground/50">
              User since
              <br />
              Oct 8, 2024
            </span>
          </div>

          {/* Lime pill — same module as card 1: group-relative y 117 */}
          <div className="absolute left-[17px] top-[117px]">
            <HighIntentPill time="08:00 PM" />
          </div>

          {/* Dashed tree from the pill down to the 4 channel icons */}
          <svg
            viewBox="0 0 306 74"
            fill="none"
            className="absolute left-0 top-[181px] h-[74px] w-full text-white/45"
            aria-hidden
          >
            <path d="M153 0v16" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M153 16c0 14-101 6-101 26v12M153 16c0 14-34 8-34 28v10M153 16c0 14 34 8 34 28v10M153 16c0 14 101 6 101 26v12"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="3 4"
            />
          </svg>

          {/* 4 channel icons — measured ~44px, flush with the panel bottom */}
          <div className="absolute left-0 top-[264px] flex w-full justify-between px-[26px]">
            {card2Channels.map((ch) => (
              <span
                key={ch.label}
                className={`flex h-11 w-11 items-center justify-center ${ch.bg}`}
                title={ch.label}
              >
                {ch.icon}
              </span>
            ))}
          </div>
        </div>
      </PanelInner>
    </CardPanel>
  );
}

/* ---------------------------------- card 3 --------------------------------- */

const shopperA = [
  "High intent",
  "Returning customer",
  "Already viewed product 5x",
  "Likely to purchase",
];
const shopperB = [
  "Medium intent",
  "Price-sensitive behavior",
  "Abandoned previously",
  "Offer-responsive",
];

/** 12-square likelihood bar (measured: A 10/12 lime, B 4/12 lime). */
function SquareBar({ lime }: { lime: number }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={`h-[9px] w-[9px] rounded-[2px] ${
            i < lime ? "bg-lime" : "bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

function Card3Panel() {
  return (
    <CardPanel src="/images/predict-card-3.jpg">
      {/* Card 3's content module measures 320px wide (x510..833). */}
      <div className="relative h-[276px] w-[320px]">
        {/* Shopper A / Shopper B labels — aligned with the columns */}
        <div className="absolute left-[19px] top-[6px] text-[13px] font-medium text-foreground/90">
          Shopper A
        </div>
        <div className="absolute left-[179px] top-[6px] text-[13px] font-medium text-foreground/90">
          Shopper B
        </div>

        {/* Two chip columns — measured 134px wide at x19/x179, chips 21px
            tall on a 29px pitch starting y54 (group-relative). */}
        {[
          { left: 19, chips: shopperA, lime: 10, offer: false },
          { left: 179, chips: shopperB, lime: 4, offer: true },
        ].map((col) => (
          <div
            key={col.left}
            className="absolute top-[54px] flex w-[134px] flex-col gap-[8px]"
            style={{ left: `${col.left}px` }}
          >
            {col.chips.map((label) => (
              <Chip key={label} label={label} className="w-fit bg-white/10" />
            ))}
            <div
              className={`mt-[8px] flex h-[27px] items-center whitespace-nowrap rounded-[8px] px-2 text-[11.5px] font-medium ${
                col.offer
                  ? "bg-[#d0862a] text-[#241500]"
                  : "bg-lime text-[#141703]"
              }`}
            >
              {col.offer ? "Predicted lift: +24%" : "Predicted purchase: 91%"}
            </div>
            <div className="mt-[8px]">
              <SquareBar lime={col.lime} />
            </div>
            {col.offer && (
              /* 10% OFFER — measured 136x32 at the bottom of column B */
              <div className="mt-[9px] flex h-8 w-[136px] items-center gap-2 rounded-[8px] bg-lime px-[7px]">
                <span className="flex h-[18px] w-[18px] items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 fill-[#141703]"
                    aria-hidden
                  >
                    <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z" />
                  </svg>
                </span>
                <span className="text-[13px] font-bold text-[#141703]">
                  10% OFFER
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </CardPanel>
  );
}

/* --------------------------------- section --------------------------------- */

export function Prediction() {
  const deckRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative pt-[80px] pb-[100px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Centered header — scraped: 44px serif, ONE line at 1440,
            "Predict"/"and act" lime, subtitle 2 lines right below */}
        <FadeUp className="mx-auto text-center">
          <h2 className="font-display text-balance text-[44px] leading-[1.15] text-foreground">
            <em className="text-lime">Predict</em> what each shopper will do
            next, <em className="text-lime">and act</em> while it still
            matters.
          </h2>
          <p className="mx-auto mt-[19px] max-w-[900px] text-base leading-6 text-muted-foreground">
            Loopcart AI&apos;s 4B Large Event Model, Aurora, reads live
            shopping behavior to predict the next likely action—and the reason
            behind it. So your marketing can respond to what someone is about
            to do, not just what they already did.
          </p>
        </FadeUp>

        {/* Scroll Container — three sticky 900x400 cards on 460px slots */}
        <DeckRefContext.Provider value={deckRef}>
          <div ref={deckRef} className="mt-[53px]">
            <StackCard offset={120} index={0}>
              <CardShell>
                <div className="flex h-full flex-col lg:flex-row">
                  <CardText
                    title="Step in before hesitation becomes abandonment"
                    sub="Automatically identifiy high-intent moments and trigger timely outreach before shoppers drop off."
                  />
                  <Card1Panel />
                </div>
              </CardShell>
            </StackCard>

            <StackCard offset={140} index={1}>
              <CardShell>
                <div className="flex h-full flex-col lg:flex-row">
                  <CardText
                    title="Reach the right shopper, on the right channel, at the right time"
                    sub="Let the AI select when and where to engage across email, SMS, WhatsApp, push, and AI voice."
                  />
                  <Card2Panel />
                </div>
              </CardShell>
            </StackCard>

            <StackCard offset={160} index={2}>
              <CardShell>
                <div className="flex h-full flex-col lg:flex-row">
                  <CardText
                    title="Save incentives for shoppers who actually need them"
                    sub="Automatically target offers where they are more likely to influence a purchase."
                  />
                  <Card3Panel />
                </div>
              </CardShell>
            </StackCard>
          </div>
        </DeckRefContext.Provider>
      </div>
    </section>
  );
}
