import Link from "next/link";

/** Emplacement à personnaliser avant mise en production (identité éditeur…). */
export function Fill({ t }: { t: string }) {
  return (
    <span className="rounded bg-amber-300/15 px-1.5 py-0.5 font-medium text-amber-200">
      [À compléter&nbsp;: {t}]
    </span>
  );
}

export function DocHeader({
  tag,
  title,
  intro,
}: {
  tag: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="border-b border-white/[0.07] pb-10 pt-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">{tag}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{intro}</p>
      <p className="mt-5 font-mono text-xs text-muted-foreground/70">
        Dernière mise à jour&nbsp;: 12 novembre 2026
      </p>
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-5 py-4 text-[13px] leading-relaxed text-amber-200/90">
      {children}
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 font-display text-2xl leading-snug tracking-tight text-foreground">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-[15px] font-semibold text-foreground">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-4 space-y-2.5 text-[14px] leading-relaxed text-muted-foreground">
      {children}
    </ul>
  );
}

export function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-lime" />
      <span>{children}</span>
    </li>
  );
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-lime/90 underline decoration-lime/30 underline-offset-4 transition-colors hover:text-lime hover:decoration-lime/60"
    >
      {children}
    </Link>
  );
}
