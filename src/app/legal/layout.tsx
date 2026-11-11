import Link from "next/link";
import { ArrowLeft, ReceiptText } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime text-primary-foreground">
              <ReceiptText className="h-4 w-4" size={16} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Factiq</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-lime/40 hover:bg-lime/[0.06] hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">{children}</main>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 Factiq — Tous droits réservés.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/legal/mentions-legales" className="transition-colors hover:text-foreground">
              Mentions légales
            </Link>
            <Link href="/legal/cgv" className="transition-colors hover:text-foreground">
              CGV
            </Link>
            <Link href="/legal/confidentialite" className="transition-colors hover:text-foreground">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
