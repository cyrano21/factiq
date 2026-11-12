#!/usr/bin/env bun
/**
 * verify-cents-xml.mjs — le XML Factur-X sérialise des montants en centimes
 * par arithmétique entière : « 12.30 », TVA 5,5 % sur 3 × 0,10 € = « 0.02 »,
 * et passe le validateur structurel. Vérifie aussi que le schéma Prisma ne
 * contient plus aucun champ monétaire Float.
 * Succès : « cents xml verified » (exit 0).
 */
import { buildFacturXXml, validateFacturXXml } from "../src/lib/facturx.ts";
import { readFileSync } from "node:fs";

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`❌ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

// ── Fixture 1 : 12,30 € à 20 % ──
const f1 = {
  number: "FAC-2026-0100",
  issueDate: "2026-11-12",
  dueDate: "2026-12-12",
  currency: "EUR",
  vatRateCentiemes: 2000,
  vatMode: "standard",
  paymentTerms: "Paiement à 30 jours",
  notes: null,
  seller: { name: "Studio Test SAS", siret: "98765432100011" },
  buyer: { name: "Client Test SARL", siret: "12345678900019" },
  lines: [{ description: "Prestation", quantity: 1, unitPriceCents: 1230 }],
};
const xml1 = buildFacturXXml(f1);
const extraire1 = (marque) => {
  const m = xml1.match(new RegExp(`${marque}[^>]*>([\\d.]+)<`));
  return m ? m[1] : null;
};
for (const [label, marque, attendu] of [
  ["ChargeAmount (ligne)", "<ram:ChargeAmount", "12.30"],
  ["LineTotalAmount", "<ram:LineTotalAmount", "12.30"],
  ["TaxBasisTotalAmount", "<ram:TaxBasisTotalAmount", "12.30"],
  ["TaxTotalAmount", "<ram:TaxTotalAmount", "2.46"], // 1230 × 20 % = 246 c
  ["GrandTotalAmount", "<ram:GrandTotalAmount", "14.76"],
  ["DuePayableAmount", "<ram:DuePayableAmount", "14.76"],
  ["RateApplicablePercent", "<ram:RateApplicablePercent", "20.00"],
]) {
  const obtenu = extraire1(marque);
  if (obtenu !== attendu) fail(`${label} : attendu ${attendu}, obtenu ${obtenu}`);
}
const v1 = validateFacturXXml(xml1);
if (!v1.ok) fail(`XML 12,30 € rejeté par le validateur : ${JSON.stringify(v1.errors)}`);
ok("12,30 € à 20 % → 12.30 / TVA 2.46 / TTC 14.76 (arithmétique entière)");

// ── Fixture 2 : 3 × 0,10 € à 5,5 % (cas de contrôle du contrat) ──
const f2 = {
  ...f1,
  vatRateCentiemes: 550,
  lines: [
    { description: "Micro 1", quantity: 1, unitPriceCents: 10 },
    { description: "Micro 2", quantity: 1, unitPriceCents: 10 },
    { description: "Micro 3", quantity: 1, unitPriceCents: 10 },
  ],
};
const xml2 = buildFacturXXml(f2);
const extraire = (marque) => {
  const m = xml2.match(new RegExp(`${marque}>([\\d.]+)<`));
  return m ? m[1] : null;
};
const ht = extraire("<ram:TaxBasisTotalAmount");
const tva = xml2.match(/<ram:TaxTotalAmount[^>]*>([\d.]+)</)?.[1];
const ttc = extraire("<ram:GrandTotalAmount");
if (ht !== "0.30") fail(`HT attendu 0.30, obtenu ${ht}`);
if (tva !== "0.02") fail(`TVA attendue 0.02 (BR-CO-17), obtenue ${tva}`);
if (ttc !== "0.32") fail(`TTC attendu 0.32, obtenu ${ttc}`);
const v2 = validateFacturXXml(xml2);
if (!v2.ok) fail(`XML 3×0,10 € rejeté : ${JSON.stringify(v2.errors)}`);
ok("3 × 0,10 € à 5,5 % → HT 0.30 / TVA 0.02 / TTC 0.32 + validateur ok");

// ── Aucun champ monétaire Float dans le schéma Prisma ──
const schema = readFileSync("prisma/schema.prisma", "utf8");
if (/^\s*unitPrice\s+Float/m.test(schema)) fail("prisma/schema.prisma contient encore unitPrice Float");
if (/^\s*vatRate\s+Float/m.test(schema)) fail("prisma/schema.prisma contient encore vatRate Float");
if (!/unitPriceCents\s+Int/.test(schema)) fail("prisma/schema.prisma : unitPriceCents Int absent");
if (!/vatRateCentiemes\s+Int/.test(schema)) fail("prisma/schema.prisma : vatRateCentiemes Int absent");
ok("schéma Prisma : unitPriceCents Int + vatRateCentiemes Int, zéro Float monétaire");

// ── Aucun reste Float monétaire dans les sources de la chaîne ──
for (const file of ["src/lib/invoice-service.ts", "src/app/api/invoices/route.ts"]) {
  const code = readFileSync(file, "utf8");
  if (/\bunitPrice\b(?!Cents)/.test(code)) fail(`${file} référence encore « unitPrice » (ancien champ Float)`);
  if (/\bvatRate\b(?!Centiemes)/.test(code)) fail(`${file} référence encore « vatRate » (ancien champ Float)`);
}
ok("chaîne API : plus aucune référence aux anciens champs Float");

if (failures > 0) {
  console.error(`verify-cents-xml : ${failures} échec(s)`);
  process.exit(1);
}
console.log("cents xml verified");
