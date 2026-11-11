"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/** Strong ease-out for entrances (emil-animate tokens). */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * The exact transition scraped from the original's compiled animation
 * definitions (framer runtime): every viewport-enter tween on the page
 * uses this cubic-bezier — lt {delay:.2,duration:1}, dt {delay:.1,
 * duration:.7}, pt {delay:0,duration:1}, Q {delay:.2,duration:1}.
 */
export const FRAMER_EASE: [number, number, number, number] = [
  0.12, 0.23, 0.17, 0.99,
];

/** Spring scraped from the "Porifle found" chips (ht): stiffness 300,
 *  damping 50, mass 0.5, delay 0.7s — the badges use the same spring with
 *  delay .3 (G) and the main visual stiffness 270 (Et). */
export const FRAMER_CHIP_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 50,
  mass: 0.5,
} as const;

/**
 * The site we clone runs Framer's default appear spring: 1000 ms with a
 * ~1.5% overshoot peaking around 57% of the timeline (scraped keyframes:
 * `linear(0 … 1.0151@57.5% … 1)`). framer-motion reproduces it with a
 * duration-constrained spring and a small bounce.
 */
export const FRAMER_SPRING = { type: "spring", duration: 1, bounce: 0.08 } as const;

/**
 * Fade-up on first scroll into view — the exact "$"/"ct" enter variant
 * scraped from the original: opacity 0 -> 1, y 40 -> 0, tween duration 1s
 * with the scraped ease, triggered at 50% visibility, animate once.
 * Reduced motion: opacity only, no translation.
 */
export function FadeUp({
  children,
  className,
  delay = 0.2,
  y = 40,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ delay, duration: 1, ease: FRAMER_EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The scraped "ci" variant: same tween as FadeUp but y 20 -> 0 (section
 * subtitles in Features / Ecosystems / 1:1 / Personalization engine).
 */
export function FadeUpShort({
  children,
  className,
  delay = 0.2,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <FadeUp className={className} delay={delay} y={20}>
      {children}
    </FadeUp>
  );
}

/**
 * The scraped "ut"/"vi" enter variant: opacity stays 1, the element pops
 * from scale .8 / y 10 with the short tween (delay .1, duration .7) —
 * used by the recovery-slide images and the "asset 01" product strip.
 */
export function PopFloat({
  children,
  className,
  delay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, scale: reduce ? 1 : 0.8, y: reduce ? 0 : 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ delay, duration: 0.7, ease: FRAMER_EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The scraped "Tt" enter variant (recovery-slide main frame): opacity 1,
 * scale 0 -> 1 with the Et spring (stiffness 270, damping 50, mass .5,
 * no delay), at 50% visibility, once.
 */
export function PopScale({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, scale: reduce ? 1 : 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: "spring", stiffness: 270, damping: 50, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The scraped badge variants (Dt/jt/Ft/Rt/Vt/Wt around the recovery
 * visual): opacity 1, scale 0 -> 1 flying in from an offset, with the G
 * spring (stiffness 300, damping 50, mass .5, delay .3).
 */
export function BadgeIn({
  children,
  className,
  x = 0,
  y = 0,
}: {
  children: ReactNode;
  className?: string;
  x?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 1,
        scale: reduce ? 1 : 0,
        x: reduce ? 0 : x,
        y: reduce ? 0 : y,
      }}
      whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 50,
        mass: 0.5,
        delay: 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container for grids/lists. Children must be <StaggerItem>. */
export function Stagger({
  children,
  className,
  delayChildren = 0,
  step = 0.08,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  step?: number;
}) {
  const reduce = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : step, delayChildren },
    },
  };
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: { opacity: 1, y: 0, transition: { ...FRAMER_SPRING } },
  };
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/**
 * Scroll-linked background parallax with spring smoothing so the drift feels
 * fluid and clearly visible. The image overscans vertically so the
 * translation never reveals an edge. Reduced motion: gentler travel.
 */
export function ParallaxBg({
  src,
  distance = 70,
  className = "",
  imgOpacity = 1,
  imgClassName = "",
  position = "center",
}: {
  src: string;
  distance?: number;
  className?: string;
  imgOpacity?: number;
  imgClassName?: string;
  /** object-position / background-position of the real asset (e.g. the
      original "BG 2" backdrop uses 50.9% 61%). */
  position?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });
  const travel = reduce ? distance * 0.45 : distance;
  const y = useTransform(smooth, [0, 1], [-travel, travel]);

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className={`absolute inset-x-0 -inset-y-[24%] bg-cover will-change-transform ${imgClassName}`}
        style={{
          y,
          backgroundImage: `url(${src})`,
          opacity: imgOpacity,
          backgroundPosition: position,
        }}
      />
    </div>
  );
}

/**
 * Horizontal scroll-linked drift — for oversized decorative letters/shapes
 * that slide sideways while the page scrolls past.
 */
export function ParallaxX({
  children,
  distance = 80,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });
  const travel = reduce ? distance * 0.45 : distance;
  const x = useTransform(smooth, [0, 1], [-travel, travel]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ x }}>{children}</motion.div>
    </div>
  );
}

/**
 * Seamless infinite marquee. The real page drives five of these through
 * Framer's Ticker module (WAAPI, linear, infinite): hero logos drift right
 * over 41.18s, the behavior-section product strip slides left over 39.5s,
 * the 1:1 section runs two vertical credit tickers (6.57s / 5.31s, both
 * downward) and a horizontal solutions strip (20s, rightward).
 *
 * Two copies of the children are laid out in a row/column; animating
 * between 0 and -50% (or -50% and 0 for the opposite direction) loops
 * seamlessly. `dir` 1 = content moves left/up, -1 = right/down.
 */
export function Ticker({
  children,
  axis = "x",
  dir = 1,
  duration = 40,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  axis?: "x" | "y";
  dir?: 1 | -1;
  duration?: number;
  className?: string;
  innerClassName?: string;
}) {
  const horizontal = axis === "x";
  const from = dir === 1 ? "0%" : "-50%";
  const to = dir === 1 ? "-50%" : "0%";

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className={`flex w-max ${horizontal ? "" : "flex-col"} ${innerClassName}`}
        animate={horizontal ? { x: [from, to] } : { y: [from, to] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        <div
          className={`flex shrink-0 items-center ${horizontal ? "" : "flex-col"}`}
        >
          {children}
        </div>
        <div
          className={`flex shrink-0 items-center ${horizontal ? "" : "flex-col"}`}
          aria-hidden
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Pop-in of the real "Porifle found" chips — the scraped "W" enter
 * variant: opacity stays 1, scale 0 -> 1 while rotating from -50deg to 0,
 * with the ht spring (stiffness 300, damping 50, mass 0.5, delay .7s),
 * triggered at 50% visibility, animate once. The five chips of a slide
 * use the scraped delays .7 / 1.3 / 1.9 / 1.4 / 1.6 (ht/_t/yt/xt/Ct).
 */
export function PopIn({
  children,
  className,
  delay = 0.7,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 1,
        scale: reduce ? 1 : 0,
        rotate: reduce ? 0 : -50,
      }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ ...FRAMER_CHIP_SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-linked diagonal entrance — the real "Browse Abandonment" visual
 * slides into place from translate(-243px, -244px) toward (0, 0) as it
 * scrolls up (measured matrices at scrollY 3200). Reduced motion: static.
 */
export function SlideInDiag({
  children,
  distance = 120,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });
  const d = reduce ? 0 : distance;
  const x = useTransform(smooth, [0, 1], [-d, 0]);
  const y = useTransform(smooth, [0, 1], [-d, 0]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ x, y }}>{children}</motion.div>
    </div>
  );
}

/**
 * Count-up for marketing stats. Starts when scrolled into view.
 * Renders a MotionValue directly — no React re-renders per frame.
 * Reduced motion: jumps straight to the final value.
 */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1.4,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const raw = useMotionValue(reduce ? value : 0);
  const text = useTransform(raw, (v) => `${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      raw.set(value);
      return;
    }
    const controls = animate(raw, value, {
      duration,
      ease: EASE_OUT,
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce, raw]);

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </motion.span>
  );
}
