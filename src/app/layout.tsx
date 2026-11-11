import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Factiq | La facturation électronique conforme pour indépendants",
  description:
    "Factures électroniques conformes à la réforme 2026-2027 : PDF avec XML Factur-X EN 16931 embarqué, TVA standard ou art. 293 B, numérotation automatique. Pensez micro-entrepreneurs et freelances.",
  keywords: [
    "facturation électronique",
    "Factur-X",
    "facture électronique obligatoire",
    "réforme 2026 2027",
    "micro-entrepreneur",
    "freelance",
    "facture conforme",
    "PDP",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
