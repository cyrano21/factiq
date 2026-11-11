"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FadeUp, FRAMER_CHIP_SPRING } from "./motion";

/**
 * Real "Cart Recovery" section, rebuilt from the scrape + live measurement
 * of the original (markopolo.ai). Everything below was measured on the
 * running site:
 *
 * Cycle: each left card is active ~6.5s, in order Browse -> Cart ->
 * Checkout; the right panel crossfades between the three scraped states.
 *
 * Right panel (486x488 on the original): landscape backdrop + one big
 * glass card per state (measured on the checkout state as "main frame":
 * 404x359 inset 39/64, blur(6px),
 * background: linear-gradient(282deg, rgba(0,0,0,.7) 25%, rgba(46,76,41,.7) 139%),
 * border-radius 14px).
 *
 * Browse state ("asset 01" frame, measured): avatar marquee of 54px
 * circles (77px pitch, ~35px/s to the left) where dark circles hold a lime
 * person silhouette and real portraits pop in one by one (one per ~1.8s)
 * with a lime check badge at the top-right; below, the michelle card
 * 403x288 (header 54px: 44px rounded avatar, Username/michelle, Eligible
 * pill + "User since Oct 8, 2024"; Activities 3 columns 11.24px/9px with
 * vertical separators; Contact 14px) whose phone + email lines decode
 * character by character at random positions (both observed mid-states:
 * "m h l smi g il o" and "400 R-2").
 *
 * Cart state (measured, panel-relative): alternating timeline on a center
 * rule — Browse/Email Ignored/8:00 AM right y97, Cart Add/SMS Read/12:30 PM
 * left y134, Return visit/WhatsApp typing.../3:00 PM right y171, AI Voice
 * Call/Call Initiated/06:00 PM left y208; then the 06:00 PM bubble with the
 * two-line David quote (13px), a white waveform squiggle and the
 * "Purchase successfull" pill (12px) at y372.
 *
 * Checkout state (measured, glass 404x359): scattered dark pills — "2x
 * viewed size guide" top-center, "Hovered 'Add to Cart' 4 times" left,
 * "Scrolled price reviews twice" right, "Started checkout process"
 * bottom-left, "Hesitated on checkout for 2.3 seconds" bottom-center — all
 * drifting gently; the lime "Behavioral Pattern Detected" pill
 * (linear-gradient(90deg, rgba(101,129,57,.6), rgba(0,0,0,.6)), blur 5px,
 * radius 12px, official Shopify bag SVG 15x18, "06:00 PM" on the right);
 * and a lime cursor with the Michelle avatar chip pointing back at it.
 *
 * Left active card: 1px #d8fe91 border (sampled rgb(189,223,126) over
 * black), radius 16px. Lime accents on this panel use #d8fe91 (the
 * measured dot color of the section pattern: box-shadow rgb(216,254,145)).
 */

const ACCENT = "#d8fe91";

const types = [
  {
    key: "browse" as const,
    title: "Browse abandonment recovery",
    desc: "Re-engages visitors who view products but leave without adding to their cart.",
  },
  {
    key: "cart" as const,
    title: "Cart abandonment recovery",
    desc: "Messages shoppers who add items to cart but exit before checkout.",
  },
  {
    key: "checkout" as const,
    title: "Checkout abandonment recovery",
    desc: "Contacts shoppers who initiated checkout but left without finishing.",
  },
];

const backdrops: Record<string, string> = {
  browse: "/images/recovery-landscape.png",
  cart: "/images/recovery-real-cart.png",
  checkout: "/images/recovery-real-checkout.png",
};

/* Real scraped portraits that pop into the marquee. */
const marqueePhotos = [
  "/images/recovery-av-2.png",
  "/images/recovery-av-4.png",
  "/images/recovery-av-1.png",
  "/images/recovery-av-3.png",
  "/images/recovery-av-5.jpg",
];

const activities = [
  { label: "Viewed product A", time: "11:00am" },
  { label: "Viewed product B", time: "11:04am" },
  { label: "Comparing.", time: "11:06am" },
];

/* Lime person silhouette used inside the unidentified circles. */
function PersonIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={ACCENT} aria-hidden>
      <circle cx="12" cy="8.2" r="4.1" />
      <path d="M12 13.6c-4.6 0-7.6 2.5-7.6 6.1V21h15.2v-1.3c0-3.6-3-6.1-7.6-6.1Z" />
    </svg>
  );
}

/* Official Shopify bag, scraped as SVG paths from the live pill. */
function ShopifyBag({ width = 15, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 21 24" fill="none" aria-hidden>
      <path
        d="M18.3748 4.66784C18.3608 4.5413 18.2491 4.48506 18.1654 4.48506C18.0816 4.48506 16.2525 4.34446 16.2525 4.34446C16.2525 4.34446 14.9819 3.06503 14.8283 2.93849C14.6887 2.79789 14.4234 2.84007 14.3117 2.86819C14.2977 2.86819 14.0324 2.95255 13.5996 3.09315C13.1668 1.84183 12.4267 0.702988 11.1003 0.702988H10.9746C10.6116 0.224956 10.1369 0 9.74591 0C6.67413 0 5.19409 3.86643 4.73333 5.8348C3.53254 6.21441 2.68082 6.46749 2.58308 6.50966C1.91288 6.72056 1.89892 6.73462 1.81514 7.36731C1.74533 7.84534 0 21.4411 0 21.4411L13.5856 24L20.9579 22.3972C20.9719 22.3691 18.3888 4.79437 18.3748 4.66784ZM12.8456 3.28998C12.5105 3.3884 12.1056 3.51494 11.7007 3.65554V3.40246C11.7007 2.64323 11.6029 2.0246 11.4214 1.53251C12.1196 1.61687 12.5524 2.39016 12.8456 3.28998ZM10.5697 1.68717C10.7512 2.1652 10.8769 2.84007 10.8769 3.76801V3.90861C10.1229 4.14763 9.32703 4.38664 8.50324 4.65378C8.964 2.88225 9.84365 2.01054 10.5697 1.68717ZM9.6761 0.815464C9.81572 0.815464 9.95535 0.871703 10.067 0.956062C9.0757 1.42003 8.02851 2.58699 7.59567 4.94903C6.93942 5.15993 6.3111 5.34271 5.71071 5.53954C6.21337 3.73989 7.47 0.815464 9.6761 0.815464Z"
        fill="#95BF47"
      />
      <path
        d="M18.1656 4.45661C18.0818 4.45661 16.2527 4.31602 16.2527 4.31602C16.2527 4.31602 14.9821 3.03658 14.8285 2.91004C14.7727 2.8538 14.7029 2.82568 14.647 2.82568L13.6277 23.9997L21 22.3969C21 22.3969 18.4169 4.79405 18.403 4.66751C18.3471 4.54097 18.2494 4.48473 18.1656 4.45661Z"
        fill="#5E8E3E"
      />
      <path
        d="M11.1007 8.56202L10.2071 11.2755C10.2071 11.2755 9.39728 10.8397 8.43386 10.8397C6.99571 10.8397 6.9259 11.7536 6.9259 11.9785C6.9259 13.2158 10.1373 13.6938 10.1373 16.6042C10.1373 18.8959 8.69915 20.3722 6.75834 20.3722C4.41262 20.3722 3.23976 18.91 3.23976 18.91L3.86808 16.8292C3.86808 16.8292 5.09679 17.8977 6.13003 17.8977C6.81419 17.8977 7.09345 17.3634 7.09345 16.9697C7.09345 15.3529 4.46847 15.2826 4.46847 12.6112C4.46847 10.3757 6.06021 8.21052 9.28558 8.21052C10.4864 8.19646 11.1007 8.56202 11.1007 8.56202Z"
        fill="white"
      />
    </svg>
  );
}

/* Lime mouse cursor as seen next to the Michelle chip. */
function CursorArrow({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M5.5 3.2 19 12.4l-6.2.9-2.9 5.6L5.5 3.2Z"
        fill={ACCENT}
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="1.1"
      />
    </svg>
  );
}

/**
 * Decode effect measured on the Contact block: characters settle one by
 * one at random positions while the remaining slots flicker dim random
 * characters (mid-states "m h l smi g il o" and "400 R-2" on the real
 * site). Restarts every time the panel mounts.
 */
function DecodeText({ text, duration = 1600, className }: { text: string; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState<number[]>(() => []);
  const order = useMemo(() => {
    const idx = text.split("").map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [text]);

  useEffect(() => {
    if (reduce) {
      setShown(order);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const n = Math.floor(p * order.length);
      setShown(order.slice(0, n));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [order, duration, reduce]);

  const settled = new Set(shown);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text.split("").map((ch, i) =>
        settled.has(i) ? (
          <span key={i}>{ch}</span>
        ) : (
          <span key={i} className="opacity-25">
            {ch === " " ? " " : "\u00A0"}
          </span>
        ),
      )}
    </span>
  );
}

/* ── BROWSE state ─────────────────────────────────────────────────────── */

/** One marquee chip: dark disc + lime silhouette; the real portrait pops
 *  in with the scraped "W" variant (scale 0, rotate -50 -> 1/0, spring
 *  300/50/.5) when the chip is 50% visible, delays scraped from the
 *  five ht/_t/yt/xt/Ct instances: .7 / 1.3 / 1.9 / 1.4 / 1.6s. */
function MarqueeAvatar({ photo, delay }: { photo: string | null; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative block h-[54px] w-[54px] shrink-0">
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[#20261a]/75">
        <PersonIcon />
      </span>
      {photo !== null && (
        <motion.span
          initial={{
            opacity: 1,
            scale: reduce ? 1 : 0,
            rotate: reduce ? 0 : -50,
          }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ ...FRAMER_CHIP_SPRING, delay }}
          className="absolute inset-0 block overflow-hidden rounded-full"
        >
          <img src={photo} alt="" className="h-full w-full object-cover" draggable={false} />
        </motion.span>
      )}
      {photo !== null && (
        <motion.span
          initial={{
            opacity: 1,
            scale: reduce ? 1 : 0,
            rotate: reduce ? 0 : -50,
          }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ ...FRAMER_CHIP_SPRING, delay: delay + 0.08 }}
          className="absolute -right-0.5 -top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full"
          style={{ background: ACCENT }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.2 5 8.7l4.5-5" stroke="#101408" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      )}
    </span>
  );
}

/** The full row drifts left at the scraped 40px/s (924px set width,
 *  duration = 924 / 40 = 23.1s; measured live on the original). */
function AvatarMarquee() {
  const cells = [null, 0, null, 1, null, 2, null, 3, null, 4, null, null];
  // Scraped pop-in delays of the five chips (ht/_t/yt/xt/Ct).
  const chipDelays = [0.7, 1.3, 1.9, 1.4, 1.6];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[13%] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex w-max items-center gap-[23px] pr-[23px]"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 23.1, ease: "linear", repeat: Infinity }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-[23px]" aria-hidden={copy === 1}>
            {cells.map((p, i) =>
              p === null ? (
                <MarqueeAvatar photo={null} delay={0} key={`s-${copy}-${i}`} />
              ) : (
                <MarqueeAvatar photo={marqueePhotos[p]} delay={chipDelays[p]} key={`p-${copy}-${i}`} />
              ),
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function BrowsePanel() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 flex flex-col">
      <AvatarMarquee />
      {/* The michelle card — the slide's "main frame" enters with the
          scraped "Tt" variant: opacity 1, scale 0 -> 1, Et spring
          (stiffness 270, damping 50, mass .5, no delay). */}
      <motion.div
        initial={{ opacity: 1, scale: reduce ? 1 : 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 270, damping: 50, mass: 0.5 }}
        className="mx-auto mt-[118px] w-[83%] overflow-hidden rounded-[14px] border border-white/10 bg-black/35 backdrop-blur-md"
      >
        {/* header — 54px on the original */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <img
            src="/images/recovery-av-1.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
            draggable={false}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-4 text-white/50">Username</p>
            <p className="text-[16px] font-semibold leading-5 text-white">michelle</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span
              className="rounded-full px-3 py-[3px] text-[12px] font-medium text-[#101408]"
              style={{ background: ACCENT }}
            >
              Eligible
            </span>
            <p className="text-[11px] leading-4 text-white/50">User since Oct 8, 2024</p>
          </div>
        </div>

        {/* Activities — 3 columns with hairline separators */}
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <p className="text-[13.5px] font-semibold text-white">Activities</p>
          <div className="mt-2 grid grid-cols-3">
            {activities.map((a, i) => (
              <div
                key={a.label}
                className={i === 0 ? "pr-3" : "border-l border-white/12 px-3"}
              >
                <p className="text-[11px] leading-4 text-white/85">{a.label}</p>
                <p className="mt-0.5 text-[9px] leading-3 text-white/45">{a.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact — decodes character by character */}
        <div className="px-4 pb-5">
          <p className="text-[14px] font-semibold text-white">Contact</p>
          <div className="mt-2 space-y-0.5">
            <DecodeText text="+1 (707) 400-0521" duration={1400} className="block text-[14px] leading-5 text-white/90" />
            <DecodeText text="michelle.smith@gmail.com" duration={1800} className="block text-[14px] leading-5 text-white/90" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── CART state ───────────────────────────────────────────────────────── */

const timeline = [
  { step: "Browse", note: "Email Ignored", time: "8:00 AM", side: "right" },
  { step: "Cart Add", note: "SMS Read", time: "12:30 PM", side: "left" },
  { step: "Return visit", note: "WhatsApp typing...", time: "3:00 PM", side: "right" },
  { step: "AI Voice Call", note: "Call Initiated", time: "06:00 PM", side: "left" },
] as const;

function CartPanel() {
  const reduce = useReducedMotion();
  const pos = ["top-[7%] left-[54%]", "top-[17%] right-[56%]", "top-[27%] left-[54%]", "top-[37%] right-[58%]"];
  return (
    <div className="absolute inset-0">
      {/* center rule */}
      <motion.span
        initial={{ scaleY: reduce ? 1 : 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: [0.12, 0.23, 0.17, 0.99] }}
        className="absolute bottom-[24%] left-1/2 top-[6%] w-px origin-top bg-white/15"
        aria-hidden
      />
      {timeline.map((t, i) => (
        <motion.div
          key={t.step}
          initial={{ opacity: 1, scale: reduce ? 1 : 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.12, 0.23, 0.17, 0.99] }}
          className={`absolute ${pos[i]} flex items-start gap-2 whitespace-nowrap`}
        >
          {t.side === "left" && (
            <span className="mt-1 flex items-center gap-2">
              <span className="text-[8px] text-white/40">{t.time}</span>
              <span className="h-px w-5 bg-white/20" aria-hidden />
            </span>
          )}
          <span className="flex flex-col">
            <span className="text-[12px] font-semibold leading-4 text-white">{t.step}</span>
            <span className="text-[10px] leading-4 text-white/60">{t.note}</span>
          </span>
          {t.side === "right" && (
            <span className="mt-1 flex items-center gap-2">
              <span className="h-px w-5 bg-white/20" aria-hidden />
              <span className="text-[8px] text-white/40">{t.time}</span>
            </span>
          )}
        </motion.div>
      ))}

      {/* message bubble + waveform + purchase pill */}
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.12, 0.23, 0.17, 0.99] }}
        className="absolute inset-x-[12%] top-[50%] rounded-xl bg-white/[0.04] px-5 py-3 text-center backdrop-blur-sm"
      >
        <p className="text-[8px] text-white/40">06:00 PM</p>
        <p className="mt-1 text-[13px] leading-5 text-white/90">
          &quot;Hi David, I noticed you had questions about the fit.
          <br />
          Let me connect you with our style expert...&quot;
        </p>
        <svg
          viewBox="0 0 120 14"
          className="mx-auto mt-1.5 h-3 w-24 text-white/70"
          fill="none"
          aria-hidden
        >
          <path
            d="M2 7c8-5 14 5 22 0s14 5 22 0 14 5 22 0 14 5 22 0 14 5 22 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 1, scale: reduce ? 1 : 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.12, 0.23, 0.17, 0.99] }}
        className="absolute left-1/2 top-[76%] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[12px] text-white/90"
      >
        Purchase successfull
      </motion.div>
    </div>
  );
}

/* ── CHECKOUT state ───────────────────────────────────────────────────── */

const checkoutPills = [
  { txt: "2x viewed size guide", pos: "left-1/2 top-[5%] -translate-x-1/2", drift: 5.6, delay: 0 },
  { txt: "Hovered \u2018Add to Cart\u2019 4 times", pos: "left-[4%] top-[20%]", drift: 6.4, delay: 0.7 },
  { txt: "Scrolled price reviews twice", pos: "right-[4%] top-[20%]", drift: 5.2, delay: 1.3 },
  { txt: "Started checkout process", pos: "left-[10%] top-[70%]", drift: 6.8, delay: 0.4 },
  { txt: "Hesitated on checkout for 2.3 seconds", pos: "left-1/2 top-[84%] -translate-x-1/2", drift: 5.9, delay: 1 },
];

function CheckoutPanel() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0">
      {checkoutPills.map((p) => (
        <motion.div
          key={p.txt}
          initial={{ opacity: 1, scale: reduce ? 1 : 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.12, 0.23, 0.17, 0.99] }}
          className={`absolute ${p.pos} whitespace-nowrap rounded-full bg-black/45 px-4 py-2 text-[12px] text-white/90 backdrop-blur-md`}
        >
          {p.txt}
        </motion.div>
      ))}

      {/* Behavioral Pattern Detected — lime gradient pill with the Shopify bag
          (the slide's gradient "main frame" — scraped Tt: scale 0 -> 1,
          Et spring 270/50/.5). */}
      <motion.div
        initial={{ opacity: 1, scale: reduce ? 1 : 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 270, damping: 50, mass: 0.5 }}
        className="absolute left-1/2 top-[38%] w-[72%] -translate-x-1/2"
      >
        <div
          className="flex items-center gap-2.5 rounded-xl border border-white/10 px-3.5 py-3 backdrop-blur-md"
          style={{
            background:
              "linear-gradient(90deg, rgba(101,129,57,0.33) 0%, rgba(0,0,0,0.33) 100%)",
          }}
        >
          <ShopifyBag />
          <span className="flex-1 text-[14px] font-medium leading-5 text-white">
            Behavioral Pattern Detected
          </span>
          <span className="text-[11px] text-white/70">06:00 PM</span>
        </div>

        {/* lime cursor + Michelle chip pointing back at the pill — scraped
            badge variant: scale 0 -> 1 from below, G spring (300/50/.5,
            delay .3). */}
        <motion.div
          initial={{ opacity: 1, scale: reduce ? 1 : 0, y: reduce ? 0 : 130 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 50, mass: 0.5, delay: 0.3 }}
          className="absolute -bottom-[74px] left-[62%] flex flex-col items-start"
        >
          <CursorArrow />
          <span className="ml-1.5 flex flex-col items-center">
            <img
              src="/images/recovery-av-1.png"
              alt=""
              className="h-6 w-6 rounded-full object-cover"
              draggable={false}
            />
            <span className="-mt-0.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">
              Michelle
            </span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

const PANELS: Record<string, () => React.JSX.Element> = {
  browse: BrowsePanel,
  cart: CartPanel,
  checkout: CheckoutPanel,
};

export function Recovery() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<0 | 1 | 2>(0);

  // Measured: the original auto-advances every ~6.5s (checkout -> browse ->
  // cart observed at t=0/6.8/13.2s). Clicking a row selects it and pauses
  // the rotation.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setActive((a) => ((a + 1) % 3) as 0 | 1 | 2), 6500);
    return () => clearInterval(id);
  }, [paused, reduce]);

  const ActivePanel = PANELS[types[active].key];

  return (
    <section className="relative pt-[112px] pb-[77px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeUp className="mx-auto max-w-[820px] text-center">
          <h2 className="font-display text-balance text-[42px] leading-[1.15] text-foreground">
            Recover abandoned carts and checkouts with AI
          </h2>
          <p className="mt-8 text-base leading-6 text-muted-foreground">
            Our AI powers your ecommerce growth by assigning{" "}
            <span className="text-lime">revenue agents</span> to every single
            visitor. They work 24/7 to grow your business and recover revenue
            you&apos;d otherwise lose.
          </p>
        </FadeUp>

        <FadeUp delay={0.08}>
          <div className="mt-[120px] grid overflow-hidden rounded-3xl border border-white/8 bg-card/50 dot-grid lg:grid-cols-2">
            {/* Left: "All done autonomously" + the three recovery types */}
            <div className="p-8">
              <h3 className="font-display text-balance text-3xl leading-[1.05] text-foreground sm:text-[30px]">
                All done <em className="text-lime">autonomously</em>. No manual
                workflows or A/B testing required.
              </h3>

              <div className="mt-8 space-y-[56px]">
                {types.map((type, i) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => {
                      setActive(i as 0 | 1 | 2);
                      setPaused(true);
                    }}
                    className={`block w-full rounded-2xl border px-5 py-3.5 text-left transition-colors duration-300 ${
                      active === i
                        ? "border-[#d8fe91]/60 bg-[#d8fe91]/[0.03]"
                        : "border-transparent hover:bg-white/[0.02]"
                    }`}
                    aria-pressed={active === i}
                  >
                    <h4 className="text-[15px] font-semibold text-foreground">
                      {type.title}
                    </h4>
                    <p className="mt-1 text-xs leading-4 text-muted-foreground">
                      {type.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: measured 486x488 panel — backdrop + one big glass card */}
            <div className="relative min-h-[488px] overflow-hidden border-t border-white/8 lg:border-l lg:border-t-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={types[active].key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="absolute inset-0"
                  aria-hidden
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backdrops[types[active].key]})` }}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-x-[8%] inset-y-[13%] overflow-hidden rounded-[14px] border border-white/10 backdrop-blur-md"
                style={{
                  background:
                    "linear-gradient(282deg, rgba(0,0,0,0.7) 25%, rgba(46,76,41,0.7) 139%)",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={types[active].key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                  >
                    <ActivePanel />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
