#!/usr/bin/env bun
/**
 * verify-facturx-validator.mjs — contrôle positif ET négatifs du validateur
 * structurel du XML CII EN 16931 (validateFacturXXml, src/lib/facturx.ts).
 * Usage : bun scripts/verify-facturx-validator.mjs
 */
import { buildFacturXXml, validateFacturXXml } from "../src/lib/facturx.ts";

const facture = {
  number: "FAC-2025-0042",
  issueDate: "2025-11-12",
  dueDate: "2025-12-12",
  currency: "EUR",
  vatRateCentiemes: 2000, // 20 %
  vatMode: "standard",
  paymentTerms: "Paiement à 30 jours — virement bancaire (IBAN sur demande).",
  notes: null,
  seller: {
    name: "Studio Verlaine SAS",
    address: "18 rue de la République",
    zip: "69002",
    city: "Lyon",
    siret: "98765432100011",
  },
  buyer: {
    name: "Boulangerie Dupont SARL",
    address: "12 rue des Lilas",
    zip: "69003",
    city: "Lyon",
    siret: "12345678900019",
  },
  // Montants en CENTIMES ENTIERS : 1250 € → 125000, 12,30 € → 1230, 0,10 € → 10.
  lines: [
    { description: "Prestation de conseil en organisation (forfait jour)", quantity: 1, unitPriceCents: 125000 },
    { description: "Frais de port et emballage du dossier d'échantillons", quantity: 1, unitPriceCents: 1230 },
    { description: "Échantillon connecteur USB-C (unité de démonstration)", quantity: 1, unitPriceCents: 10 },
  ],
};

let echecs = 0;
const echec = (message) => {
  echecs++;
  console.error(`  ✗ ${message}`);
};
const succes = (message) => {
  console.log(`  ✓ ${message}`);
};

/** Vérifie qu'une mutation du XML est bien rejetée avec une erreur pertinente. */
function attendreRejet(label, xmlMute, motifErreur) {
  const res = validateFacturXXml(xmlMute);
  if (res.ok) {
    echec(`mutation « ${label} » ACCEPTÉE à tort par le validateur.`);
    return;
  }
  const pertinente = res.errors.some((e) => motifErreur.test(e));
  if (!pertinente) {
    echec(
      `mutation « ${label} » rejetée mais sans erreur pertinente (attendu /${motifErreur.source}/) : ${JSON.stringify(res.errors)}`
    );
    return;
  }
  succes(`mutation « ${label} » rejetée : ${res.errors[0]}`);
}

/* ─── Contrôle positif : le XML généré est valide ─── */
const xml = buildFacturXXml(facture);
const base = validateFacturXXml(xml);
if (!base.ok || base.errors.length > 0) {
  echec(`le XML généré par buildFacturXXml est rejeté : ${JSON.stringify(base.errors)}`);
} else {
  succes("contrôle positif : le XML généré est accepté (ok=true, errors vide).");
}

/* ─── Contrôles négatifs : chaque mutation doit être rejetée ─── */

const muter = (label, xmlMute) => {
  if (xmlMute === xml) {
    echec(`mutation « ${label} » : le motif de remplacement n'a rien modifié (script à corriger).`);
    return null;
  }
  return xmlMute;
};

// 1. TaxBasisTotalAmount falsifié (+500 €)
const m1 = muter(
  "TaxBasis falsifié",
  xml.replace(
    /(<ram:TaxBasisTotalAmount>)([\d.]+)(<\/ram:TaxBasisTotalAmount>)/,
    (_, avant, val, apres) => `${avant}${(parseFloat(val) + 500).toFixed(2)}${apres}`
  )
);
if (m1) attendreRejet("TaxBasis falsifié", m1, /BR-CO-10|TaxBasisTotalAmount/);

// 2. GrandTotalAmount falsifié (+100 €)
const m2 = muter(
  "GrandTotal falsifié",
  xml.replace(
    /(<ram:GrandTotalAmount>)([\d.]+)(<\/ram:GrandTotalAmount>)/,
    (_, avant, val, apres) => `${avant}${(parseFloat(val) + 100).toFixed(2)}${apres}`
  )
);
if (m2) attendreRejet("GrandTotal falsifié", m2, /BR-CO-11|GrandTotalAmount/);

// 3. GUIDeline retirée
const m3 = muter(
  "GUIDeline retirée",
  xml.replace(
    /<ram:GuidelineSpecifiedDocumentContextParameter>[\s\S]*?<\/ram:GuidelineSpecifiedDocumentContextParameter>/,
    ""
  )
);
if (m3) attendreRejet("GUIDeline retirée", m3, /GUIDeline/);

// 4. TypeCode du document changé (380 → 381 = avoir)
const m4 = muter(
  "TypeCode changé",
  xml.replace("<ram:TypeCode>380</ram:TypeCode>", "<ram:TypeCode>381</ram:TypeCode>")
);
if (m4) attendreRejet("TypeCode changé", m4, /TypeCode/);

// 5. DuePayableAmount falsifié (bonus)
const m5 = muter(
  "DuePayable falsifié",
  xml.replace(
    /(<ram:DuePayableAmount>)([\d.]+)(<\/ram:DuePayableAmount>)/,
    (_, avant, val, apres) => `${avant}${(parseFloat(val) + 1).toFixed(2)}${apres}`
  )
);
if (m5) attendreRejet("DuePayable falsifié", m5, /BR-CO-12|DuePayableAmount/);

// 6. IssueDateTime retiré (bonus)
const m6 = muter(
  "IssueDateTime retiré",
  xml.replace(/<ram:IssueDateTime>[\s\S]*?<\/ram:IssueDateTime>/, "")
);
if (m6) attendreRejet("IssueDateTime retiré", m6, /IssueDateTime/);

/* ─── Verdict ─── */
if (echecs > 0 || !base.ok) {
  console.error(`verify-facturx-validator : ${echecs} échec(s).`);
  process.exit(1);
}
console.log("facturx validator ok");
