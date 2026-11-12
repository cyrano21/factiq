#!/usr/bin/env bun
/**
 * Auto-test de src/lib/money.ts (gate G1 de leaf-1.2.1) — JS pur : un
 * fichier .mjs n'est pas transpilé TypeScript par bun.
 * Contrôle positif ET négatif. Succès : « money verified » (exit 0).
 */
import assert from "node:assert";
import {
  centsToDecimalString,
  computeTotalsCents,
  formatEUR,
  lineTotalCents,
  toCents,
} from "../src/lib/money.ts";

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`❌ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

/* ── toCents : cas positifs ── */
assert.strictEqual(toCents("12,30"), 1230, "virgule FR");
assert.strictEqual(toCents("12.30"), 1230, "point décimal");
assert.strictEqual(toCents(12.3), 1230, "float euros");
assert.strictEqual(toCents("0,1"), 10, "0,1 → 10 c");
assert.strictEqual(toCents("0.1"), 10, "0.1 → 10 c");
assert.strictEqual(toCents("1 250,50"), 125050, "espace milliers");
assert.strictEqual(toCents("1\u00a0250,50"), 125050, "espace insécable milliers");
assert.strictEqual(toCents("100"), 10000, "entier euros");
assert.strictEqual(toCents(0), 0, "zéro");
assert.strictEqual(toCents("0,005"), 1, "arrondi demi-centime vers le haut");
ok("toCents : conversions exactes");

/* ── toCents : cas négatifs (rejet) ── */
for (const bad of ["", "abc", "12,3,4", "1..2", "-5", -5, NaN, Infinity, "12,30 €", "e5", "12.30.1"]) {
  if (toCents(bad) !== null) {
    fail(`toCents aurait dû rejeter : ${JSON.stringify(bad)}`);
  }
}
ok("toCents : rejets (NaN, négatif, formats invalides)");

/* ── formatEUR ── */
// L'espace avant € (et de milliers) varie selon l'ICU (U+00A0 / U+202F) : regex \s.
assert.match(formatEUR(1230), /^12,30\s€$/u, "format fr-FR (espace insécable)");
assert.match(formatEUR(0), /^0,00\s€$/u, "zéro");
assert.match(formatEUR(1250500), /^12\s505,00\s€$/u, "séparateur de milliers fin");
let threw = false;
try {
  formatEUR(12.5);
} catch {
  threw = true;
}
assert.ok(threw, "formatEUR refuse les non-entiers");
ok("formatEUR : fr-FR + refus non-entier");

/* ── centsToDecimalString (arithmétique entière) ── */
assert.strictEqual(centsToDecimalString(1230), "12.30");
assert.strictEqual(centsToDecimalString(5), "0.05");
assert.strictEqual(centsToDecimalString(100), "1.00");
assert.strictEqual(centsToDecimalString(1250500), "12505.00");
ok("centsToDecimalString : XML/PDF 2 décimales exactes");

/* ── lineTotalCents ── */
assert.strictEqual(lineTotalCents(1.5, 2000), 3000, "1,5 × 20 € = 30 €");
assert.strictEqual(lineTotalCents(3, 10), 30, "3 × 10 c = 30 c");
assert.strictEqual(lineTotalCents(0.333333, 999), 333, "arrondi au centime");
ok("lineTotalCents : arrondi comptable par ligne");

/* ── computeTotalsCents : cas de contrôle du contrat ── */
// 3 lignes de 0,10 € à 5,5 % : HT = 30 c, TVA = round(30 × 550 / 10 000) = 2 c.
const small = computeTotalsCents(
  [
    { quantity: 1, unitPriceCents: 10 },
    { quantity: 1, unitPriceCents: 10 },
    { quantity: 1, unitPriceCents: 10 },
  ],
  550,
  "standard"
);
assert.strictEqual(small.totalHTCents, 30, "HT 3×10 c");
assert.strictEqual(small.totalVATCents, 2, "TVA 5,5 % arrondie (BR-CO-17)");
assert.strictEqual(small.totalTCCCents, 32, "TTC exact en entiers");

// 12,30 € + 1250,00 € à 20 % : HT 126230, TVA 25246, TTC 151476.
const realistic = computeTotalsCents(
  [
    { quantity: 1, unitPriceCents: 1230 },
    { quantity: 1, unitPriceCents: 125000 },
  ],
  2000,
  "standard"
);
assert.strictEqual(realistic.totalHTCents, 126230);
assert.strictEqual(realistic.totalVATCents, 25246);
assert.strictEqual(realistic.totalTCCCents, 151476);

// Franchise : TVA nulle, TTC = HT.
const franchise = computeTotalsCents([{ quantity: 2, unitPriceCents: 1000 }], 2000, "franchise");
assert.strictEqual(franchise.totalVATCents, 0);
assert.strictEqual(franchise.totalTCCCents, 2000);
ok("computeTotalsCents : BR-CO-10/17 + franchise");

/* ── computeTotalsCents : rejets ── */
for (const badRate of [-1, 20.5, NaN]) {
  let threw = false;
  try {
    computeTotalsCents([{ quantity: 1, unitPriceCents: 100 }], badRate, "standard");
  } catch {
    threw = true;
  }
  if (!threw) fail(`computeTotalsCents aurait dû rejeter le taux ${badRate}`);
}
ok("computeTotalsCents : rejets de taux invalides");

/* ── le piège historique du Float est mort ── */
// 0,1 + 0,2 en float = 0.30000000000000004 ; en centimes : 10 + 20 = 30.
assert.strictEqual(toCents(0.1) + toCents(0.2), 30, "0,1 € + 0,2 € = 30 c exactement");
ok("0,1 € + 0,2 € = 0,30 € exactement (le bug float est éliminé)");

if (failures > 0) {
  console.error(`money-selftest : ${failures} échec(s)`);
  process.exit(1);
}
console.log("money verified");
