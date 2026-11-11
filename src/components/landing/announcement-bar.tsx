import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * Pinned announcement bar — on the real site this bar stays fixed at the very
 * top (48px tall) while the page scrolls (verified at scrollY 800).
 * Mobile (scraped at 390px): text wraps to two lines and the "Explore
 * Athena" link stays visible on the right — so the link is never hidden.
 */
export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-12 bg-[#15190a]/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center gap-6 px-4 text-sm">
        <p className="text-[13px] leading-[1.3] text-foreground/90 sm:text-sm">
          Our Large Event Model that topped the OPeRA benchmark is now live!
        </p>
        <Link
          href="#aurora"
          className="inline-flex shrink-0 items-center gap-1.5 underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Explore Aurora
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
