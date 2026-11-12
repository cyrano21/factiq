/**
 * Source unique de tout calcul monétaire Factiq (refonte « centimes entiers »).
 *
 * Pourquoi les centimes entiers : les nombres à virgule flottante (Float/IEEE
 * 754) ne représentent pas exactement les décimales monétaires (0.1 + 0.2 ≠
 * 0.3), ce qui est inacceptable pour des documents comptables. Tous les
 * montants sont donc stockés et calculés en CENTIMES ENTIERS (Int) :
 * 12,30 € → 1230.
 *
 * Règles EN 16931 respectées :
 * - BR-CO-10 : Σ (LineTotalAmount) = TaxBasisTotalAmount — chaque ligne est
 *   arrondie au centime PUIS sommée (jamais l'inverse) ;
 * - BR-CO-17 : CalculatedAmount = BasisAmount × taux, arrondi au centime.
 *
 * Interdits (cf. AGENTS.md §2) : introduire un nouveau champ monétaire Float,
 * ou faire un calcul d'argent hors de ce module.
 */

/* ────────────────────────── Conversion de saisie ────────────────────────── */

/**
 * Convertit une saisie décimale (« 12,30 », « 12.30 », « 0,1 » ou 12.3) en
 * centimes entiers. Retourne null si la valeur n'est pas un montant valide
 * (NaN, Infinity, vide, plusieurs séparateurs, chiffres insuffisants).
 *
 * Accepte la virgule française, un point décimal, et les espaces/espaces
 * insécables de milliers. Les valeurs négatives sont rejetées : un montant
 * de facture saisi est toujours ≥ 0 (les avoirs passeront par un type de
 * document dédié, jamais par un montant négatif).
 */
export function toCents(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return Math.round(input * 100);
  }
  const cleaned = input
    .replace(/[\s\u00a0\u202f]/g, "") // espaces (y compris insécables) de milliers
    .replace(",", "."); // virgule française → point
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/* ────────────────────────── Formatage ────────────────────────── */

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** Formatte des centimes en euros « fr-FR » : 1230 → « 12,30 € ». */
export function formatEUR(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatEUR attend des centimes entiers, reçu : ${cents}`);
  }
  return eurFormatter.format(cents / 100);
}

/**
 * Représentation XML/PDF à 2 décimales, par ARITHMÉTIQUE ENTIÈRE (aucune
 * division flottante) : 1230 → « 12.30 ». Montants négatifs interdits.
 */
export function centsToDecimalString(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`Montant invalide (centimes entiers ≥ 0 attendus) : ${cents}`);
  }
  const euros = Math.trunc(cents / 100);
  const remainder = cents - euros * 100;
  return `${euros}.${String(remainder).padStart(2, "0")}`;
}

/* ────────────────────────── Totaux (EN 16931) ────────────────────────── */

export type TotalsCents = {
  totalHTCents: number;
  totalVATCents: number;
  totalTCCCents: number;
};

/** Arrondi comptable au centime d'un produit quantity × unitPriceCents. */
export function lineTotalCents(quantity: number, unitPriceCents: number): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(`Quantité invalide : ${quantity}`);
  }
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    throw new Error(`Prix unitaire invalide (centimes entiers ≥ 0 attendus) : ${unitPriceCents}`);
  }
  return Math.round(quantity * unitPriceCents);
}

/**
 * Totaux d'une facture (un seul taux) en centimes :
 * - totalHT : somme des lignes DÉJÀ arrondies (BR-CO-10) ;
 * - TVA : base × (taux centièmes / 10 000), arrondie au centime (BR-CO-17) ;
 * - totalTTC : HT + TVA (exact en entiers).
 * `vatRateCentiemes` : taux × 100 (20 % → 2000, 5,5 % → 550).
 */
export function computeTotalsCents(
  lines: { quantity: number; unitPriceCents: number }[],
  vatRateCentiemes: number,
  vatMode: "standard" | "franchise"
): TotalsCents {
  if (!Number.isInteger(vatRateCentiemes) || vatRateCentiemes < 0) {
    throw new Error(`Taux de TVA invalide (centièmes entiers ≥ 0 attendus) : ${vatRateCentiemes}`);
  }
  const totalHTCents = lines.reduce((s, l) => s + lineTotalCents(l.quantity, l.unitPriceCents), 0);
  const totalVATCents =
    vatMode === "franchise"
      ? 0
      : Math.round((totalHTCents * vatRateCentiemes) / 10000);
  return {
    totalHTCents,
    totalVATCents,
    totalTCCCents: totalHTCents + totalVATCents,
  };
}
