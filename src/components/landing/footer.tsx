import type { CSSProperties } from "react";

const columns = [
  {
    title: "Solutions",
    links: [
      "Visitor identification",
      "Abandon cart recovery",
      "1:1 personalisation",
      "Multi language agent",
      "Multi channel agent",
      "Events and audience",
    ],
  },
  {
    title: "Resources",
    links: [
      "Loopcart vs Klaviyo",
      "Loopcart vs MoEngage",
      "Loopcart vs Clevertap",
      "Loopcart vs Bloomreach",
      "Loopcart vs Insider",
      "Blog",
    ],
  },
  {
    title: "Persona",
    links: ["CROs", "Head of marketing", "Founders"],
  },
  {
    title: "Company",
    links: [
      "About us",
      "Company news",
      "Product updates",
      "Aurora",
      "Pricing",
      "Affiliate",
      "Contact",
      "Careers",
    ],
  },
  {
    title: "Legal",
    links: [],
  },
];

/** The six real social anchors of the original footer (scraped hrefs). */
const socials = [
  { icon: "facebook", href: "https://www.facebook.com/Markopoloai/", label: "Facebook" },
  { icon: "instagram", href: "https://www.instagram.com/markopolo.ai/", label: "Instagram" },
  { icon: "linkedin", href: "https://www.linkedin.com/company/markopolo-ai/", label: "LinkedIn" },
  { icon: "tiktok", href: "https://www.tiktok.com/@markopolo_ai", label: "TikTok" },
  { icon: "x", href: "https://x.com/markopolo_ai", label: "X" },
  { icon: "threads", href: "https://www.threads.net/", label: "Threads" },
];

/** Exact vertical mask of the original footer landscape
 *  (linear-gradient(0deg, transparent 32%, black 50% 68%, transparent 87%)). */
const FOOTER_MASK =
  "linear-gradient(0deg, rgba(0, 0, 0, 0) 32%, rgba(0, 0, 0, 0.5) 68%, rgba(0, 0, 0, 0) 87%)";

/** Social icon rendered exactly like the original: the scraped SVG used
 *  as a CSS alpha mask over a white fill. */
function SocialIcon({ name, label }: { name: string; label: string }) {
  const style: CSSProperties = {
    maskImage: `url(/images/icons/social-${name}.svg)`,
    WebkitMaskImage: `url(/images/icons/social-${name}.svg)`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    backgroundColor: "rgb(255,255,255)",
  };
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-5 w-5 items-center justify-center opacity-90 transition-opacity hover:opacity-60"
    >
      <span className="block h-full w-full" style={style} />
    </a>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/5">
      {/* Real footer landscape (scraped) — full-bleed, anchored to the
          bottom edge with the same aspect ratio (1.78431) and the same
          vertical gradient mask as the original backdrop layer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: FOOTER_MASK,
          WebkitMaskImage: FOOTER_MASK,
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 aspect-[1.78431] bg-cover"
          style={{
            backgroundImage: "url(/images/footer-landscape.jpg)",
            backgroundPosition: "center bottom",
          }}
        />
      </div>

      {/* Scraped footer geometry (1440px): block starts right after the
          CTA (no gap), first content at +20, wordmark zone 316px, link
          columns 279px, bottom bar 37px, 40px bottom padding — 853 total. */}
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-[20px] sm:px-6">
        {/* GIANT wordmark watermark, full-width above the columns — same
            treatment as the original (lime at 0.3 opacity, vertical fade
            mask 37% -> 109%). */}
        <div
          aria-hidden
          className="pointer-events-none flex w-full select-none justify-center overflow-hidden"
          style={{
            opacity: 0.3,
            maskImage:
              "linear-gradient(0deg, rgba(0, 0, 0, 0) 37%, rgba(0, 0, 0, 1) 109%)",
            WebkitMaskImage:
              "linear-gradient(0deg, rgba(0, 0, 0, 0) 37%, rgba(0, 0, 0, 1) 109%)",
          }}
        >
          <span className="font-display whitespace-nowrap text-[clamp(80px,24.5vw,352px)] leading-[0.9] tracking-tight text-lime">
            loopcart
          </span>
        </div>

        {/* Four link columns, exactly like the original */}
        <div className="relative mt-[80px] grid gap-10 sm:grid-cols-3 lg:grid-cols-5">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-medium text-foreground/85">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="block text-sm leading-5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar: copyright + "Join Our Community" button + the six
            real social icons (the original has no Privacy/Terms links). */}
        <div className="relative mt-20 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-1.5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            2026 © Loopcart AI Inc. All Rights Reserved
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="inline-flex items-center rounded-lg border border-lime/50 px-4 py-1.5 text-xs font-medium text-lime transition-all duration-300 hover:bg-lime hover:text-primary-foreground"
            >
              Join Our Community
            </a>
            <div className="flex items-center gap-4">
              {socials.map((social) => (
                <SocialIcon key={social.icon} name={social.icon} label={social.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
