"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

const solutions = [
  {
    title: "Visitor identification",
    desc: "Know who is browsing before they convert",
  },
  {
    title: "Abandoned cart recovery",
    desc: "AI agents bring shoppers back automatically",
  },
  {
    title: "1:1 personalization",
    desc: "Every message tailored to every shopper",
  },
  {
    title: "Multi-channel journeys",
    desc: "Email, SMS, push, WhatsApp and voice in one flow",
  },
];

const company = [
  { title: "About us", desc: "The team behind Loopcart" },
  { title: "Company news", desc: "What we shipped this month" },
  { title: "Product updates", desc: "Release notes and changelogs" },
  { title: "Careers", desc: "Build the future of shopper engagement" },
];

/* Flat items for the mobile drawer — scraped from the original's mobile
   menu: feature links, partnerships/pricing, then auth CTAs at the end. */
const mobileLinks = [
  ...solutions.map((s) => s.title),
  "Partnerships",
  "Pricing",
];

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: { title: string; desc: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        className={`absolute left-0 top-full w-80 rounded-xl border border-border bg-popover/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-200 ${
          open
            ? "visible translate-y-1 opacity-100"
            : "invisible translate-y-2 opacity-0"
        }`}
      >
        {items.map((item) => (
          <Link
            key={item.title}
            href="#"
            className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Lock body scroll while the drawer is open. */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
    <header className="fixed inset-x-0 top-12 z-40 border-b border-white/5 bg-background/70 backdrop-blur-[8px]">
      <nav
        className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        {/* Desktop: dropdowns left */}
        <div className="hidden items-center gap-1 md:flex">
          <NavDropdown label="Solutions" items={solutions} />
          <NavDropdown label="Company" items={company} />
          <Link
            href="#"
            className="rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground"
          >
            Partnerships
          </Link>
          <Link
            href="#"
            className="rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </div>

        {/* Logo: left on mobile (like the original), centered on desktop */}
        <Link
          href="/"
          className="font-display text-[26px] tracking-tight text-foreground md:absolute md:left-1/2 md:-translate-x-1/2"
        >
          loopcart
        </Link>

        {/* Desktop: auth pills right — the original hides them on mobile */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          <Link
            href="#"
            className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
          >
            Log in
          </Link>
          <Link
            href="#"
            className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className="-mr-1 rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" aria-hidden />
          ) : (
            <Menu className="h-6 w-6" aria-hidden />
          )}
        </button>

        {/* Mobile drawer — content scraped from the original's mobile menu:
            feature links, partnerships, pricing, then Sign In / Start free.
            Rendered OUTSIDE the header: the header's backdrop-blur makes it
            the containing block for fixed descendants, which would collapse
            the drawer to a zero-height box inside it. */}
      </nav>
    </header>

    {mobileOpen && (
      <div className="fixed inset-x-0 top-[112px] bottom-0 z-40 overflow-y-auto border-t border-white/5 bg-background px-6 pb-10 pt-2 md:hidden">
            <nav className="flex flex-col">
              {mobileLinks.map((title) => (
                <Link
                  key={title}
                  href="#"
                  className="border-b border-white/5 py-4 text-lg text-foreground transition-colors hover:text-lime"
                  onClick={() => setMobileOpen(false)}
                >
                  {title}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="#"
                className="rounded-lg bg-white/5 px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="#"
                className="rounded-lg bg-lime px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85"
                onClick={() => setMobileOpen(false)}
              >
                Sign up
              </Link>
            </div>
      </div>
    )}
    </>
  );
}
