import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://factiq.fr";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Factiq | La facturation électronique conforme pour indépendants",
    template: "%s | Factiq",
  },
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Factiq",
    url: SITE_URL,
    title: "Factiq — La facturation électronique conforme pour indépendants",
    description:
      "PDF Factur-X (XML EN 16931 embarqué), TVA standard ou franchise art. 293 B, prêt pour la réforme 2026-2027. Gratuit pour commencer.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Factiq — La facturation électronique conforme pour indépendants",
    description:
      "PDF Factur-X conforme EN 16931, prêt pour la réforme 2026-2027. Gratuit pour commencer.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
};

/** Données structurées : application + FAQ (rich results Google). */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Factiq",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr-FR",
      description:
        "Outil de facturation électronique pour indépendants français : PDF avec XML Factur-X (CII EN 16931) embarqué, conforme à la réforme 2026-2027.",
      offers: [
        { "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR" },
        {
          "@type": "Offer",
          name: "Pro",
          price: "9",
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
        {
          "@type": "Offer",
          name: "Bureau",
          price: "29",
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Un PDF envoyé par e-mail, c'est une facture électronique ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Non. Depuis la réforme, une facture électronique doit contenir des données structurées (formats UBL, CII ou Factur-X) transmises via une plateforme agréée. Factiq génère le XML Factur-X et l'embarque dans le PDF : le fichier visuel reste lisible, et les données machines sont prêtes.",
          },
        },
        {
          "@type": "Question",
          name: "Je suis micro-entrepreneur en franchise de TVA, est-ce pour moi ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Vous êtes concerné par l'obligation de réception dès 2026 et d'émission en 2027. Factiq gère le régime de franchise : taux 0 % avec la mention légale « TVA non applicable, art. 293 B du CGI » sur la facture et le code d'exonération dans le XML.",
          },
        },
        {
          "@type": "Question",
          name: "Faut-il passer par une plateforme agréée (PDP) ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "À terme, oui : l'échange transitera par des plateformes agréées ou le portail public. Factiq prépare des fichiers conformes (PDF Factur-X et XML CII) que ces plateformes acceptent, pour que votre bascule soit immédiate le moment venu.",
          },
        },
        {
          "@type": "Question",
          name: "Que se passe-t-il si je dépasse les 5 factures gratuites ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Le plan Gratuit permet de tester le flux complet avec 5 factures. Au-delà, le plan Pro à 9 €/mois débloque la facturation illimitée — moins cher qu'une seule amende de non-conformité.",
          },
        },
        {
          "@type": "Question",
          name: "Mes données sont-elles en sécurité ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Vos comptes sont protégés par mot de passe (hachage scrypt) et sessions signées. Les données restent stockées dans votre instance — aucune revente de données, aucune publicité.",
          },
        },
      ],
    },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
