#!/usr/bin/env bun
/**
 * make-sample-pdf.mjs — génère un PDF Factur-X d'exemple (PDF/A-3B) avec
 * des données réalistes françaises, et l'écrit dans /tmp/factiq-sample.pdf.
 * Usage : bun scripts/make-sample-pdf.mjs
 */
import { writeFileSync } from "node:fs";
import { buildInvoicePdf, MENTIONS_OBLIGATOIRES } from "../src/lib/invoice-pdf.ts";
import { buildFacturXXml } from "../src/lib/facturx.ts";
import { computeTotalsCents } from "../src/lib/money.ts";

const facture = {
  number: "FAC-2025-0042",
  issueDate: "2025-11-12",
  dueDate: "2025-12-12",
  currency: "EUR",
  vatRateCentiemes: 2000, // 20 %
  vatMode: "standard",
  paymentTerms: "Paiement à 30 jours — virement bancaire (IBAN sur demande).",
  notes: "Merci de votre confiance — Studio Verlaine SAS.",
  seller: {
    name: "Studio Verlaine SAS",
    address: "18 rue de la République",
    zip: "69002",
    city: "Lyon",
    siret: "98765432100011",
    email: "compta@studio-verlaine.fr",
  },
  buyer: {
    name: "Boulangerie Dupont SARL",
    address: "12 rue des Lilas",
    zip: "69003",
    city: "Lyon",
    siret: "12345678900019",
  },
  // 3 lignes réalistes — dont une à 12,30 € et une à 0,10 € (cas d'arrondi).
  // Montants en CENTIMES ENTIERS : 1250 € → 125000, 12,30 € → 1230, 0,10 € → 10.
  lines: [
    {
      description: "Prestation de conseil en organisation (forfait jour)",
      quantity: 1,
      unitPriceCents: 125000,
    },
    {
      description: "Frais de port et emballage du dossier d'échantillons",
      quantity: 1,
      unitPriceCents: 1230,
    },
    {
      description: "Échantillon connecteur USB-C (unité de démonstration)",
      quantity: 1,
      unitPriceCents: 10,
    },
  ],
};

const xml = buildFacturXXml(facture);
const totaux = computeTotalsCents(facture.lines, facture.vatRateCentiemes, facture.vatMode);

const pdf = await buildInvoicePdf({
  number: facture.number,
  issueDate: facture.issueDate,
  dueDate: facture.dueDate,
  currency: facture.currency,
  vatRateCentiemes: facture.vatRateCentiemes,
  vatMode: facture.vatMode,
  paymentTerms: facture.paymentTerms,
  notes: facture.notes,
  seller: facture.seller,
  buyer: facture.buyer,
  lines: facture.lines,
  totalHTCents: totaux.totalHTCents,
  totalVATCents: totaux.totalVATCents,
  totalTCCCents: totaux.totalTCCCents,
  facturxXml: xml,
});

const sortie = "/tmp/factiq-sample.pdf";
writeFileSync(sortie, pdf);

const eur = (c) => `${(c / 100).toFixed(2)}`;
console.log(
  `Sample PDF/A-3 Factur-X écrit : ${sortie} (${pdf.length} octets, ${facture.lines.length} lignes, HT ${eur(totaux.totalHTCents)} / TVA ${eur(totaux.totalVATCents)} / TTC ${eur(totaux.totalTCCCents)} ${facture.currency})`
);
console.log("Mentions obligatoires rendues dans le PDF :");
for (const mention of MENTIONS_OBLIGATOIRES) {
  console.log(`  - ${mention}`);
}
