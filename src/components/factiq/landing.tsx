"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeUp, Stagger, StaggerItem, Ticker, CountUp } from "@/components/landing/motion";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import {
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  FileCheck2,
  FileCode2,
  FileDown,
  Gauge,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const eurFmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const scrollTo = (id: string) =>
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

/* ————————————————— motion helpers ————————————————— */

/** Line revealed from behind a mask — editorial headline entrance. */
function MaskLine({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={`block overflow-hidden ${className ?? ""}`}>
      <motion.span
        className="block"
        initial={{ y: reduce ? 0 : "112%", opacity: reduce ? 0 : 1 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{ duration: 1.05, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** EUR amount that counts up when scrolled into view. */
function EuroCount({
  value,
  duration = 1.3,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const raw = useMotionValue(reduce ? value : 0);
  const text = useTransform(raw, (v) => eurFmt.format(Math.round(v)));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      raw.set(value);
      return;
    }
    const controls = animate(raw, value, { duration, ease: EASE });
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

/** Mouse-tracked 3D tilt (springs back to rest on leave). */
function Tilt({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rxRaw = useMotionValue(0);
  const ryRaw = useMotionValue(0);
  const rx = useSpring(rxRaw, { stiffness: 140, damping: 16, mass: 0.4 });
  const ry = useSpring(ryRaw, { stiffness: 140, damping: 16, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ryRaw.set(px * max * 2);
    rxRaw.set(-py * max * 1.4);
  };
  const onLeave = () => {
    rxRaw.set(0);
    ryRaw.set(0);
  };

  return (
    <div className={className} style={{ perspective: 1400 }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>
        {children}
      </motion.div>
    </div>
  );
}

/** Glass card with a lime spotlight that follows the cursor. */
function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  };
  return (
    <div
      onMouseMove={onMove}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-card card-lift ${className ?? ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--sx, 50%) var(--sy, 50%), rgba(215,247,91,0.09), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}

/* ————————————————— hero mockup ————————————————— */

function InvoiceMockup() {
  const lines = [
    { label: "Prestation de conseil", amount: 800 },
    { label: "Développement site (3 j)", amount: 1800 },
  ];

  return (
    <div className="relative">
      {/* glow under the card */}
      <div
        aria-hidden
        className="absolute -inset-x-8 -bottom-14 top-1/2 glow-emerald blur-2xl"
      />

      <Tilt max={6}>
        <div className="relative rounded-2xl border border-white/[0.1] bg-[#101413]/95 shadow-[0_40px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur">
          {/* top window bar */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
            <span className="h-2.5 w-2.5 rounded-full bg-lime/70" />
            <span className="ml-3 font-mono text-[11px] tracking-wider text-muted-foreground">
              factiq · facture conforme
            </span>
          </div>

          <div className="p-6 sm:p-7">
            {/* header */}
            <motion.div
              className="flex items-start justify-between"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Facture
                </p>
                <p className="mt-1 font-mono text-lg font-medium tracking-tight text-foreground">
                  FAC-2026-0042
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Sophie Martin → Boulangerie Dupont SAS
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1.5 text-xs font-medium text-lime">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-lime" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                Conforme
              </span>
            </motion.div>

            {/* lines */}
            <div className="mt-6 space-y-2.5">
              {lines.map((l, i) => (
                <motion.div
                  key={l.label}
                  className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 text-sm"
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.12 }}
                >
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {eurFmt.format(l.amount)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* totals */}
            <motion.div
              className="mt-5 space-y-1.5 text-sm"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
            >
              <div className="flex justify-between text-muted-foreground">
                <span>Total HT</span>
                <EuroCount value={2600} className="font-mono tabular-nums" />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>TVA (20 %)</span>
                <EuroCount value={520} duration={1.1} className="font-mono tabular-nums" />
              </div>
              <div className="mt-2 flex justify-between rounded-lg bg-lime px-3.5 py-2.5 font-semibold text-primary-foreground">
                <span>Total TTC</span>
                <EuroCount value={3120} duration={1.5} className="font-mono tabular-nums" />
              </div>
            </motion.div>

            {/* XML chip */}
            <motion.div
              className="mt-5 flex items-center gap-2.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
            >
              <FileCode2 className="h-4 w-4 shrink-0 text-emerald-300" />
              <span className="font-mono text-[11px] tracking-wide text-emerald-200/90">
                factur-x.xml — CII EN 16931 embarqué dans le PDF
              </span>
            </motion.div>
          </div>
        </div>
      </Tilt>

      {/* floating satellites */}
      <motion.div
        className="absolute -right-4 -top-5 hidden animate-float items-center gap-2 rounded-xl border border-white/[0.1] bg-[#151917]/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:flex"
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      >
        <FileDown className="h-4 w-4 text-lime" />
        <span className="font-mono text-[11px] tracking-wider text-foreground/90">PDF/A-3</span>
      </motion.div>

      <motion.div
        className="absolute -bottom-6 -left-5 hidden animate-float-slow items-center gap-2 rounded-xl border border-white/[0.1] bg-[#151917]/95 px-3.5 py-2.5 shadow-xl backdrop-blur sm:flex"
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.65 }}
      >
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        <span className="font-mono text-[11px] tracking-wider text-foreground/90">EN 16931</span>
      </motion.div>
    </div>
  );
}

/* ————————————————— page ————————————————— */

const NAV_LINKS: Array<[string, string]> = [
  ["Conformité", "#conformite"],
  ["Produit", "#produit"],
  ["Tarifs", "#tarifs"],
  ["FAQ", "#faq"],
];

export default function Landing({
  onSignup,
  onLogin,
}: {
  onSignup: () => void;
  onLogin: () => void;
}) {
  const [billingMsg, setBillingMsg] = useState<string | null>(null);

  const choosePlan = async (plan: string) => {
    if (plan === "free") {
      onSignup();
      return;
    }
    // Les plans payants nécessitent un compte : on l'a d'abord créé,
    // puis le Checkout Stripe se lance depuis les paramètres.
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    if (res.status === 401) {
      setBillingMsg("Créez d'abord votre compte gratuit — le paiement se fait ensuite en 2 clics.");
      onSignup();
      return;
    }
    setBillingMsg(data.error ?? "Indisponible");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <SmoothScroll />

      {/* NAV — floating glass pill */}
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
      >
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <div className="flex h-14 items-center justify-between rounded-2xl border border-white/[0.08] bg-background/70 px-3 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-4">
            <div className="flex items-center gap-2.5 pl-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime text-primary-foreground">
                <ReceiptText className="h-4 w-4" size={16} />
              </span>
              <span className="text-[17px] font-semibold tracking-tight">Factiq</span>
            </div>
            <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
              {NAV_LINKS.map(([label, href]) => (
                <button
                  key={href}
                  onClick={() => scrollTo(href)}
                  className="rounded-lg px-3 py-1.5 transition-colors hover:bg-white/[0.05] hover:text-foreground"
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onLogin}>
                Se connecter
              </Button>
              <Button size="sm" className="font-medium" onClick={onSignup}>
                Essai gratuit
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section className="relative overflow-hidden pb-24 pt-40 lg:pb-32 lg:pt-48">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_65%_at_50%_-5%,black_25%,transparent_78%)]"
        />
        <div
          aria-hidden
          className="absolute -top-44 left-1/2 h-[520px] w-[880px] -translate-x-1/2 glow-lime"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -right-32 h-[420px] w-[620px] glow-emerald"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.1] bg-white/[0.04] py-1.5 pl-2 pr-4 backdrop-blur"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-lime">
                <Landmark className="h-3 w-3" />
                2026–2027
              </span>
              <span className="text-[13px] text-muted-foreground">
                La réforme de facturation électronique est entrée en vigueur
              </span>
            </motion.div>

            <h1 className="mt-7 font-display text-[44px] leading-[1.02] sm:text-6xl lg:text-[76px]">
              <MaskLine delay={0.35}>Vos factures,</MaskLine>
              <MaskLine delay={0.47}>
                <span className="italic text-gradient-lime">conformes</span> par
              </MaskLine>
              <MaskLine delay={0.59}>construction.</MaskLine>
            </h1>

            <motion.p
              className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}
            >
              Depuis le 1<sup>er</sup> septembre 2026, toute entreprise en France doit
              recevoir des factures électroniques. Au 1<sup>er</sup> septembre 2027, les
              TPE et micro-entrepreneurs devront en émettre. Factiq génère vos factures
              au format Factur-X — XML EN 16931 embarqué dans le PDF, prêt pour les
              plateformes agréées.
            </motion.p>

            <motion.div
              className="mt-9 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.88 }}
            >
              <Button
                size="lg"
                className="group h-12 px-6 text-[15px] font-medium"
                onClick={onSignup}
              >
                Créer mon compte gratuitement
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/[0.14] bg-white/[0.02] px-6 text-[15px] backdrop-blur hover:bg-white/[0.06]"
                onClick={() => scrollTo("#conformite")}
              >
                Comprendre l'obligation
              </Button>
            </motion.div>

            <motion.p
              className="mt-5 text-[13px] text-muted-foreground/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.05 }}
            >
              Sans carte bancaire · 5 factures offertes · Résiliable à tout moment
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.55 }}
          >
            <InvoiceMockup />
          </motion.div>
        </div>
      </section>

      {/* FORMATS TICKER */}
      <div className="relative border-y border-white/[0.07] bg-white/[0.015] py-5">
        <Ticker duration={36} className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          {[
            "Factur-X",
            "UBL 2.1",
            "CII — UN/CEFACT",
            "EN 16931",
            "PDF/A-3",
            "DGFiP",
            "Plateformes agréées (PDP)",
            "Art. 293 B du CGI",
            "Loi de finances 2024",
          ].map((t) => (
            <span key={t} className="flex items-center">
              <span className="px-7 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground/80">
                {t}
              </span>
              <span className="h-1.5 w-1.5 rotate-45 bg-lime/60" />
            </span>
          ))}
        </Ticker>
      </div>

      {/* CONFORMITÉ — deux dates */}
      <section id="conformite" className="relative scroll-mt-24 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp className="max-w-2xl" y={26}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">
              Conformité
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              L'obligation, en <span className="italic text-gradient-lime">deux dates</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              La réforme impose l'échange de factures électroniques structurées (UBL, CII
              ou Factur-X) via des plateformes agréées. Un simple PDF envoyé par e-mail ne
              compte plus.
            </p>
          </FadeUp>

          {/* timeline */}
          <div className="relative mt-14">
            <motion.div
              aria-hidden
              className="absolute -top-3 left-0 hidden h-px w-full origin-left bg-gradient-to-r from-lime/60 via-emerald-400/40 to-transparent md:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
            />
            <Stagger className="grid gap-6 md:grid-cols-2" step={0.14}>
              <StaggerItem>
                <div className="card-lift relative h-full overflow-hidden rounded-2xl border border-lime/25 bg-gradient-to-b from-lime/[0.07] to-transparent p-7 sm:p-8">
                  <div className="flex items-center justify-between">
                    <CalendarClock className="h-5 w-5 text-lime" />
                    <span className="flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-lime">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-lime" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                      </span>
                      En vigueur
                    </span>
                  </div>
                  <p className="mt-6 font-display text-5xl tracking-tight sm:text-[56px]">
                    1<sup className="text-[0.5em]">er</sup> sept. 2026
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    Toutes les entreprises assujetties à la TVA doivent pouvoir
                    <strong className="text-foreground"> recevoir </strong>
                    des factures électroniques. Les grandes et moyennes entreprises
                    doivent en <strong className="text-foreground">émettre</strong>.
                  </p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="card-lift relative h-full overflow-hidden rounded-2xl border border-white/[0.09] bg-card p-7 sm:p-8">
                  <div className="flex items-center justify-between">
                    <CalendarClock className="h-5 w-5 text-muted-foreground" />
                    <span className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      À venir
                    </span>
                  </div>
                  <p className="mt-6 font-display text-5xl tracking-tight text-foreground/90 sm:text-[56px]">
                    1<sup className="text-[0.5em]">er</sup> sept. 2027
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    Les <strong className="text-foreground">TPE, PME et micro-entrepreneurs</strong>{" "}
                    doivent émettre leurs factures en format électronique et transmettre
                    leurs données d'e-reporting. Anticipez maintenant.
                  </p>
                </div>
              </StaggerItem>
            </Stagger>
          </div>

          <Stagger className="mt-6 grid gap-4 sm:grid-cols-3" step={0.1}>
            {[
              {
                icon: Ban,
                iconCls: "text-red-400",
                t: "PDF par e-mail = non conforme",
                d: "Une facture électronique doit contenir des données structurées (XML) que l'administration peut lire automatiquement.",
              },
              {
                icon: ShieldCheck,
                iconCls: "text-lime",
                t: "Amende en cas d'oubli",
                d: "15 € par facture non conforme, plafonné à 15 000 € par an. Mieux vaut être prêt avant l'échéance.",
              },
              {
                icon: FileCheck2,
                iconCls: "text-emerald-300",
                t: "Factiq vous prépare",
                d: "Factures PDF avec XML Factur-X EN 16931 embarqué, TVA standard ou art. 293 B, mentions légales françaises incluses.",
              },
            ].map((c) => (
              <StaggerItem key={c.t}>
                <SpotlightCard className="h-full p-5">
                  <c.icon className={`h-5 w-5 ${c.iconCls}`} />
                  <p className="mt-3.5 text-sm font-semibold">{c.t}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{c.d}</p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* PRODUIT — bento */}
      <section id="produit" className="relative scroll-mt-24 border-t border-white/[0.07] py-24 lg:py-32">
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-[380px] w-[760px] -translate-x-1/2 glow-lime opacity-60"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp className="mx-auto max-w-2xl text-center" y={26}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">Produit</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Tout ce qu'il faut, <span className="italic text-gradient-lime">rien de superflu</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Pensé pour les micro-entrepreneurs et freelances : créez une facture
              conforme en moins de deux minutes.
            </p>
          </FadeUp>

          <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" step={0.09}>
            {/* large card with mini dashboard */}
            <StaggerItem className="sm:col-span-2">
              <SpotlightCard className="h-full p-6 sm:p-8">
                <p className="text-lg font-semibold">Un tableau de bord qui va droit au but</p>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Montants encaissés, factures en attente, statuts : tout est visible en
                  un coup d'œil — et chaque PDF téléchargé embarque son XML conforme.
                </p>
                <div className="mt-6 space-y-2">
                  {[
                    { n: "FAC-2026-0039", c: "Studio Lumen", s: "Payée", amt: "1 980,00 €", cls: "text-lime border-lime/30 bg-lime/10" },
                    { n: "FAC-2026-0040", c: "Cabinet Vasseur", s: "Envoyée", amt: "2 400,00 €", cls: "text-amber-300 border-amber-300/30 bg-amber-300/10" },
                    { n: "FAC-2026-0041", c: "Café Mercure", s: "Brouillon", amt: "860,00 €", cls: "text-muted-foreground border-white/[0.14] bg-white/[0.04]" },
                  ].map((r) => (
                    <div
                      key={r.n}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="font-mono text-xs text-foreground/85">{r.n}</span>
                        <span className="hidden text-[13px] text-muted-foreground sm:block">{r.c}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${r.cls}`}>
                          {r.s}
                        </span>
                        <span className="font-mono text-[13px] tabular-nums text-foreground/90">{r.amt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </StaggerItem>

            {[
              {
                icon: FileCheck2,
                t: "Format Factur-X EN 16931",
                d: "Le XML CII structuré généré automatiquement à partir de vos lignes, prêt pour une plateforme agréée (PDP).",
              },
              {
                icon: FileCode2,
                t: "XML embarqué dans le PDF",
                d: "Chaque PDF contient la pièce jointe factur-x.xml — le format hybride lisible par l'humain et la machine.",
              },
              {
                icon: Landmark,
                t: "TVA standard ou franchise",
                d: "Assujetti (20 %, 10 %, 5,5 %) ou franchise : la mention « TVA non applicable, art. 293 B du CGI » est gérée pour vous.",
              },
              {
                icon: Gauge,
                t: "Numérotation et suivi",
                d: "Numéros séquentiels FAC-AAAA-NNNN conformes, statuts brouillon / envoyée / payée, échéances à 30 jours.",
              },
              {
                icon: Users,
                t: "Carnet de clients",
                d: "SIRET, adresse, TVA intracommunautaire : les identifiants repris dans le XML pour des factures acceptées du premier coup.",
              },
              {
                icon: Wallet,
                t: "Mentions légales incluses",
                d: "SIRET, conditions de paiement, pénalités de retard : votre émetteur est configuré une fois, réutilisé partout.",
              },
            ].map((f) => (
              <StaggerItem key={f.t}>
                <SpotlightCard className="h-full p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/25 bg-lime/[0.08] text-lime">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold">{f.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{f.d}</p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/[0.07] bg-white/[0.015] py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 sm:px-6 lg:grid-cols-4">
          {[
            { v: <EuroCount value={15} />, l: "d'amende par facture non conforme" },
            { v: <EuroCount value={15000} duration={1.6} />, l: "de plafond annuel par entreprise" },
            { v: <CountUp value={2} suffix=" min" />, l: "pour émettre une facture conforme" },
            { v: <CountUp value={100} suffix=" %" />, l: "des mentions légales françaises incluses" },
          ].map((s, i) => (
            <FadeUp key={s.l} delay={i * 0.08} y={22}>
              <p className="font-display text-5xl tracking-tight text-gradient-lime sm:text-[56px]">
                {s.v}
              </p>
              <p className="mt-2.5 max-w-[220px] text-[13px] leading-relaxed text-muted-foreground">
                {s.l}
              </p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="relative scroll-mt-24 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp className="mx-auto max-w-2xl text-center" y={26}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">Tarifs</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Payez moins que <span className="italic text-gradient-lime">l'amende</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground">Des tarifs simples, sans surprise.</p>
          </FadeUp>

          {billingMsg && (
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-4 py-3 text-center text-sm text-amber-200">
              {billingMsg}
            </div>
          )}

          <Stagger className="mt-14 grid items-stretch gap-5 lg:grid-cols-3" step={0.12}>
            {/* Gratuit */}
            <StaggerItem className="h-full">
              <div className="card-lift flex h-full flex-col rounded-2xl border border-white/[0.09] bg-card p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Gratuit</p>
                <p className="mt-4 font-display text-5xl">
                  0 €<span className="font-sans text-base text-muted-foreground">/mois</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Pour essayer la conformité</p>
                <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                  {["5 factures puis mise à l'échelle", "XML Factur-X complet", "Carnet de clients"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-8 w-full border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.06]" onClick={() => choosePlan("free")}>
                  Commencer gratuitement
                </Button>
              </div>
            </StaggerItem>

            {/* Pro */}
            <StaggerItem className="h-full">
              <div className="relative h-full rounded-2xl bg-gradient-to-b from-lime/70 via-lime/20 to-emerald-400/10 p-px shadow-[0_28px_70px_-28px_rgba(215,247,91,0.35)]">
                <span className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-lime px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                  Le plus choisi
                </span>
                <div className="relative flex h-full flex-col rounded-[calc(1rem+1px)] bg-[#11150f] p-7">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">Pro</p>
                  <p className="mt-4 font-display text-5xl">
                    9 €<span className="font-sans text-base text-muted-foreground">/mois</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Pour les freelances actifs</p>
                  <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                    {[
                      "Factures illimitées",
                      "PDF + XML Factur-X illimités",
                      "Relances et statuts de paiement",
                      "Support prioritaire",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-8 w-full font-medium" onClick={() => choosePlan("pro")}>
                    Choisir Pro
                  </Button>
                </div>
              </div>
            </StaggerItem>

            {/* Bureau */}
            <StaggerItem className="h-full">
              <div className="card-lift flex h-full flex-col rounded-2xl border border-white/[0.09] bg-card p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Bureau</p>
                <p className="mt-4 font-display text-5xl">
                  29 €<span className="font-sans text-base text-muted-foreground">/mois</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Pour les petites structures</p>
                <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                  {["Tout le plan Pro", "Multi-sociétés", "Transmission PDP assistée", "Export comptable"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-8 w-full border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.06]" onClick={() => choosePlan("bureau")}>
                  Choisir Bureau
                </Button>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-white/[0.07] py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FadeUp className="text-center" y={26}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">FAQ</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Questions <span className="italic text-gradient-lime">fréquentes</span>
            </h2>
          </FadeUp>

          <FadeUp className="mt-12 rounded-2xl border border-white/[0.08] bg-card/60 px-6 backdrop-blur" y={30}>
            <Accordion type="single" collapsible className="text-left">
              <AccordionItem value="q1" className="border-white/[0.07]">
                <AccordionTrigger className="text-[15px] font-medium hover:no-underline">
                  Un PDF envoyé par e-mail, c'est une facture électronique ?
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  Non. Depuis la réforme, une facture électronique doit contenir des
                  données structurées (formats UBL, CII ou Factur-X) transmises via une
                  plateforme agréée. Factiq génère le XML Factur-X et l'embarque dans le
                  PDF : le fichier visuel reste lisible, et les données machines sont
                  prêtes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="border-white/[0.07]">
                <AccordionTrigger className="text-[15px] font-medium hover:no-underline">
                  Je suis micro-entrepreneur en franchise de TVA, est-ce pour moi ?
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  Oui. Vous êtes concerné par l'obligation de réception dès 2026 et
                  d'émission en 2027. Factiq gère le régime de franchise : taux 0 % avec
                  la mention légale « TVA non applicable, art. 293 B du CGI » sur la
                  facture et le code d'exonération dans le XML.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="border-white/[0.07]">
                <AccordionTrigger className="text-[15px] font-medium hover:no-underline">
                  Faut-il passer par une plateforme agréée (PDP) ?
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  À terme, oui : l'échange transitera par des plateformes agréées ou le
                  portail public. Factiq prépare des fichiers conformes (PDF Factur-X et
                  XML CII) que ces plateformes acceptent, pour que votre bascule soit
                  immédiate le moment venu.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="border-white/[0.07]">
                <AccordionTrigger className="text-[15px] font-medium hover:no-underline">
                  Que se passe-t-il si je dépasse les 5 factures gratuites ?
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  Le plan Gratuit permet de tester le flux complet avec 5 factures.
                  Au-delà, le plan Pro à 9 €/mois débloque la facturation illimitée —
                  moins cher qu'une seule amende de non-conformité.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5" className="border-white/[0.07]">
                <AccordionTrigger className="text-[15px] font-medium hover:no-underline">
                  Mes données sont-elles en sécurité ?
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  Vos comptes sont protégés par mot de passe (hachage scrypt) et sessions
                  signées. Les données restent stockées dans votre instance — aucune
                  revente de données, aucune publicité.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </FadeUp>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden border-t border-white/[0.07] py-28 lg:py-36">
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 glow-lime"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
          <FadeUp y={24}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">
              Prêt en deux minutes
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-[56px]">
              Et si votre prochaine facture était{" "}
              <span className="italic text-gradient-lime">déjà conforme ?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Créez votre première facture Factur-X avant l'échéance de septembre 2027 —
              et n'y pensez plus jamais.
            </p>
          </FadeUp>
          <FadeUp delay={0.15} y={20}>
            <Button
              size="lg"
              className="group mt-9 h-12 px-7 text-[15px] font-medium"
              onClick={onSignup}
            >
              Créer mon compte gratuitement
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <p className="mt-4 text-[13px] text-muted-foreground/80">
              Sans carte bancaire · 5 factures offertes
            </p>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime text-primary-foreground">
                <ReceiptText className="h-4 w-4" size={16} />
              </span>
              <div>
                <p className="font-semibold text-foreground">Factiq</p>
                <p className="text-xs text-muted-foreground">
                  La facturation électronique pour indépendants
                </p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground/70">
              Factiq est un outil de préparation à la réforme de facturation
              électronique (art. 91 de la loi de finances 2024). Il ne remplace pas une
              plateforme agréée (PDP) ni un conseil fiscal. Démonstration produit.
            </p>
          </div>
          <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            {NAV_LINKS.map(([label, href]) => (
              <button
                key={href}
                onClick={() => scrollTo(href)}
                className="text-left transition-colors hover:text-foreground"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/[0.06]">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground/60 sm:px-6">
            © 2026 Factiq — Démo produit · Conçu avec soin.
          </p>
        </div>
      </footer>
    </div>
  );
}
