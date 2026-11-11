"use client";

import { useRef, useState } from "react";
import { FadeUp, FadeUpShort } from "./motion";

/**
 * Channel cards — texts and the five real feature icons scraped verbatim
 * from the original site's Features section ("Email / SMS / Whatsapp /
 * Push Notification / AI Voice Call"). The icons are the site's own SVG
 * assets (lime rgb(216,254,145) + grey rgb(55,55,55) strokes, saved
 * verbatim to /public/images/icons/feat-*.svg). Card geometry scraped
 * live at 1440px: five <a> cards, 195px wide, ~181px tall, gap 12px
 * (1022px row, centered), bg rgb(15,15,15), radius 16px, padding 25px.
 *
 * Mobile (scraped at 390px): the same five cards become a horizontal
 * snap carousel — two cards in view, each 169×181px, gap 12px, with five
 * pagination dots (active dot lime) under the row.
 */
const channels = [
  {
    icon: "/images/icons/feat-email.svg",
    name: "Email",
    desc: "Delivered to where decisions happen",
  },
  {
    icon: "/images/icons/feat-sms.svg",
    name: "SMS",
    desc: "Messages they'll actually see",
  },
  {
    icon: "/images/icons/feat-whatsapp.svg",
    name: "WhatsApp",
    desc: "Everyone's on it but few brands own it",
  },
  {
    icon: "/images/icons/feat-push.svg",
    name: "Push notifications",
    desc: "Gentle nudge at the right moment",
  },
  {
    icon: "/images/icons/feat-aivoice.svg",
    name: "AI voice call",
    desc: "Conversations that feel entirely human",
  },
];

/* Scraped mobile geometry: card 169px, gap 12px. */
const CARD_W = 169;
const GAP = 12;

export function Channels() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(
      Math.min(
        channels.length - 1,
        Math.max(0, Math.round(el.scrollLeft / (CARD_W + GAP)))
      )
    );
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * (CARD_W + GAP), behavior: "smooth" });
  };

  return (
    <section className="relative pt-[40px]">
      {/* Title — scraped: 44px serif, one line at 1440, white first half,
          ROMAN (non-italic) lime second half, sitting right where the
          hero's fade-out ends. */}
      <FadeUp className="mx-auto max-w-[1360px] px-4 text-center sm:px-6">
        <h2 className="font-display text-balance text-[clamp(26px,2.92vw,42px)] leading-[1.15] text-foreground">
          Reach high-intent customers with{" "}
          <span className="text-lime">
            marketing that&apos;s better-timed and relevant
          </span>
        </h2>
      </FadeUp>

      {/* "Channel cards" — the original animates the GRID as one "$"
          block (opacity 0->1, y 40->0, tween delay .2 dur 1), not a
          stagger of individual cards.
          Mobile: horizontal snap carousel (169px cards, 2 in view). */}
      <FadeUp className="mx-auto mt-10 max-w-[1022px] sm:px-6 lg:px-0">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:snap-none sm:overflow-visible sm:px-0 lg:grid-cols-5"
        >
          {channels.map((channel) => (
            <a
              key={channel.name}
              href="#"
              className="card-lift flex h-[181px] w-[169px] shrink-0 snap-start flex-col rounded-2xl bg-[#0f0f0f] p-[25px] transition-colors duration-300 hover:bg-[#161616] sm:h-auto sm:min-h-[188px] sm:w-auto sm:shrink"
            >
              {/* Real scraped icon (colors baked into the asset) */}
              <img
                src={channel.icon}
                alt=""
                className="h-9 w-auto self-start"
                draggable={false}
                aria-hidden
              />
              <h3 className="mt-auto pt-8 text-[14px] leading-[21px] font-medium text-foreground">
                {channel.name}
              </h3>
              <p className="mt-1 text-[12px] leading-[1.2] text-foreground/70">
                {channel.desc}
              </p>
            </a>
          ))}
        </div>

        {/* Pagination dots — scraped: five 7px dots under the carousel,
            active one lime. Mobile only (desktop shows the full row). */}
        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          {channels.map((channel, i) => (
            <button
              key={channel.name}
              type="button"
              aria-label={`Go to ${channel.name}`}
              onClick={() => goTo(i)}
              className={`h-[7px] w-[7px] rounded-full transition-colors duration-200 ${
                active === i ? "bg-lime" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </FadeUp>

      {/* Aurora paragraph — scraped: two centered lines, the model name in
          lime (Aurora = the loopcart-brand rename of "Athena"). The
          original enters it with the "ci" variant (y 20 -> 0). */}
      <FadeUpShort className="mx-auto mt-10 max-w-[1160px] px-4 text-center sm:px-6">
        <p className="text-base leading-6 text-muted-foreground">
          Loopcart AI&apos;s built-in model,{" "}
          <span className="text-lime">Aurora</span>, understands how your
          online store&apos;s visitors behave.{" "}
          <br className="hidden lg:inline" />
          It reaches the right person, at the right moment, through the right
          channel. So your customers are engaged in ways that feel natural,
          not intrusive.
        </p>
      </FadeUpShort>
    </section>
  );
}
