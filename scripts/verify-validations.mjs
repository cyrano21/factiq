#!/usr/bin/env node
/**
 * Vérification des schémas de validation (gate G1 de leaf-1.1.2).
 *
 * Contrôle positif : les payloads légitimes (dashboard + script E2E) passent.
 * Contrôles négatifs : chaque cas du contrat est rejeté avec un message
 * français non vide (aucun message zod en anglais ne doit fuiter).
 *
 * Exécution : bun scripts/verify-validations.mjs
 * Succès    : affiche exactement « validations verified » (exit 0).
 * Échec     : affiche le cas fautif (exit 1).
 */
import assert from "node:assert";
import {
  clientSchema,
  httpError,
  invoiceCreateSchema,
  invoicePatchSchema,
  registerSchema,
  settingsSchema,
} from "../src/lib/validate.ts";

let failures = 0;

function refuse(schema, label, payload) {
  const result = schema.safeParse(payload);
  if (result.success) {
    failures++;
    console.error(`❌ ${label} : accepté à tort (devrait être rejeté).`);
    return;
  }
  const { ok, firstError } = httpError(result);
  if (!ok && (!firstError || firstError.trim().length === 0)) {
    failures++;
    console.error(`❌ ${label} : rejeté mais sans message français.`);
    return;
  }
  // Garde-fou : aucun message zod par défaut en anglais ne doit fuiter.
  if (/\b(expected|received|unrecognized|invalid input|required_type)\b/i.test(firstError)) {
    failures++;
    console.error(`❌ ${label} : message non traduit → « ${firstError} ».`);
    return;
  }
  console.log(`  ✗ refusé : ${label} → « ${firstError} »`);
}

function accept(schema, label, payload, checks) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    failures++;
    console.error(`❌ ${label} : refusé à tort → « ${httpError(result).firstError} ».`);
    return;
  }
  if (checks) {
    try {
      checks(result.data);
    } catch (e) {
      failures++;
      console.error(`❌ ${label} : accepté mais données inattendues → ${e.message}`);
      return;
    }
  }
  console.log(`  ✓ accepté : ${label}`);
}

/* ═══════════ Contrôles positifs ═══════════ */
console.log("— Contrôles positifs —");

accept(invoiceCreateSchema, "facture valide complète (style dashboard)", {
  clientId: "clxx1234567890abcd",
  vatRateCentiemes: 2000,
  issueDate: "2026-01-15",
  dueDate: "2026-02-14",
  paymentTerms: "Paiement à 30 jours",
  vatMode: "standard",
  notes: "Merci de votre confiance.",
  lines: [
    { description: "Prestation conseil", quantity: 3, unitPriceCents: 45000 },
    { description: "  Support demi-journée  ", quantity: 0.5, unitPriceCents: 15025 },
  ],
}, (d) => {
  // Le serveur reçoit des valeurs propres : description trimée, quantités
  // fractionnaires (pas du formulaire : step 0,5) et prix décimaux préservés.
  assert.strictEqual(d.lines[1].description, "Support demi-journée");
  assert.strictEqual(d.lines[1].quantity, 0.5);
  assert.strictEqual(d.vatRateCentiemes, 2000);
});

accept(invoiceCreateSchema, "facture minimale (dates et conditions absents)", {
  clientId: "clxx1234567890abcd",
  lines: [{ description: "Draft", quantity: 1, unitPriceCents: 10000 }],
}, (d) => {
  assert.strictEqual(d.lines.length, 1);
  assert.strictEqual(d.issueDate, undefined);
});

accept(clientSchema, "client valide (style E2E)", {
  name: "Boulangerie Dupont",
  email: "compta@dupont.fr",
  address: "12 rue des Lilas",
  zip: "69003",
  city: "Lyon",
  siret: "12345678900019",
}, (d) => {
  assert.strictEqual(d.siret, "12345678900019");
});

accept(clientSchema, "client avec SIRET espacé (normalisé)", {
  name: "SARL Martin",
  siret: "123 456 789 00019",
}, (d) => {
  assert.strictEqual(d.siret, "12345678900019");
});

accept(settingsSchema, "paramètres émetteur valides (style E2E)", {
  legalName: "Studio Test SARL",
  siret: "98765432100011",
  vatMode: "standard",
  address: "1 avenue du Test",
  zip: "75011",
  city: "Paris",
  iban: "FR7630006000011234567890189",
});

accept(settingsSchema, "IBAN espacé et minuscule (normalisé majuscules)", {
  iban: "fr76 3000 6000 0112 3456 7890 189",
}, (d) => {
  assert.strictEqual(d.iban, "FR7630006000011234567890189");
});

accept(settingsSchema, "chaîne vide = effacement explicite conservé", {
  legalName: "Studio Test SARL",
  iban: "",
  zip: "",
}, (d) => {
  assert.strictEqual(d.iban, "");
  assert.strictEqual(d.zip, "");
});

accept(registerSchema, "inscription valide (mot de passe E2E ≥ 10)", {
  email: "test@factiq-test.fr",
  password: "Test1234!Factiq",
  name: "Utilisateur Test",
}, (d) => {
  assert.strictEqual(d.email, "test@factiq-test.fr");
});

accept(invoicePatchSchema, "PATCH { status: paid }", { status: "paid" });

/* ═══════════ Contrôles négatifs — facture ═══════════ */
console.log("— Contrôles négatifs : facture —");

const VALID_INVOICE = () => ({
  clientId: "clxx1234567890abcd",
  vatRateCentiemes: 2000,
  issueDate: "2026-01-15",
  dueDate: "2026-02-14",
  paymentTerms: "Paiement à 30 jours",
  lines: [{ description: "Prestation conseil", quantity: 3, unitPriceCents: 45000 }],
});

refuse(invoiceCreateSchema, "quantité 0", {
  ...VALID_INVOICE(),
  lines: [{ description: "Ligne", quantity: 0, unitPriceCents: 10000 }],
});
refuse(invoiceCreateSchema, "quantité négative (-2)", {
  ...VALID_INVOICE(),
  lines: [{ description: "Ligne", quantity: -2, unitPriceCents: 10000 }],
});
refuse(invoiceCreateSchema, "quantité géante (1 000 001)", {
  ...VALID_INVOICE(),
  lines: [{ description: "Ligne", quantity: 1_000_001, unitPriceCents: 100 }],
});
refuse(invoiceCreateSchema, "unitPriceCents négatif", {
  ...VALID_INVOICE(),
  lines: [{ description: "Ligne", quantity: 1, unitPriceCents: -100 }],
});
refuse(invoiceCreateSchema, "unitPriceCents géant (au-delà de 10⁹ € en centimes)", {
  ...VALID_INVOICE(),
  lines: [{ description: "Ligne", quantity: 1, unitPriceCents: 100_000_000_001 }],
});
refuse(invoiceCreateSchema, "vatRate -1", { ...VALID_INVOICE(), vatRateCentiemes: -100 });
refuse(invoiceCreateSchema, "vatRate 150", { ...VALID_INVOICE(), vatRateCentiemes: 15000 });
refuse(invoiceCreateSchema, "unitPriceCents non entier (12.3) — Float monétaire interdit", {
  ...VALID_INVOICE(),
  lines: [{ description: "Ligne", quantity: 1, unitPriceCents: 12.3 }],
});
refuse(invoiceCreateSchema, "vatRateCentiemes « 2000 » en chaîne (pas de coercition silencieuse)", {
  ...VALID_INVOICE(),
  vatRateCentiemes: "2000",
});
refuse(invoiceCreateSchema, "issueDate « 12/05/2026 » (format FR)", {
  ...VALID_INVOICE(),
  issueDate: "12/05/2026",
});
refuse(invoiceCreateSchema, "issueDate « 2026-02-31 » (date inexistante)", {
  ...VALID_INVOICE(),
  issueDate: "2026-02-31",
});
refuse(invoiceCreateSchema, "dueDate < issueDate", {
  ...VALID_INVOICE(),
  issueDate: "2026-01-15",
  dueDate: "2026-01-14",
});
refuse(invoiceCreateSchema, "dueDate « 2026-02-30 » (date inexistante)", {
  ...VALID_INVOICE(),
  dueDate: "2026-02-30",
});
refuse(invoiceCreateSchema, "lines absentes (undefined)", {
  clientId: "clxx1234567890abcd",
});
refuse(invoiceCreateSchema, "lines [] (0 ligne)", { ...VALID_INVOICE(), lines: [] });
refuse(invoiceCreateSchema, "250 lignes (> 200)", {
  ...VALID_INVOICE(),
  lines: Array.from({ length: 250 }, (_, i) => ({
    description: `Ligne ${i + 1}`,
    quantity: 1,
    unitPriceCents: 100,
  })),
});
refuse(invoiceCreateSchema, "description vide", {
  ...VALID_INVOICE(),
  lines: [{ description: "   ", quantity: 1, unitPriceCents: 10000 }],
});
refuse(invoiceCreateSchema, "description de 501 caractères", {
  ...VALID_INVOICE(),
  lines: [{ description: "a".repeat(501), quantity: 1, unitPriceCents: 10000 }],
});
refuse(invoiceCreateSchema, "paymentTerms de 301 caractères", {
  ...VALID_INVOICE(),
  paymentTerms: "x".repeat(301),
});
refuse(invoiceCreateSchema, "notes de 2001 caractères", {
  ...VALID_INVOICE(),
  notes: "x".repeat(2001),
});
refuse(invoiceCreateSchema, "vatMode « tva20 »", { ...VALID_INVOICE(), vatMode: "tva20" });
refuse(invoiceCreateSchema, "clientId vide", { ...VALID_INVOICE(), clientId: "" });

/* ═══════════ Contrôles négatifs — client ═══════════ */
console.log("— Contrôles négatifs : client —");

refuse(clientSchema, "nom vide", { name: "   " });
refuse(clientSchema, "nom de 201 caractères", { name: "a".repeat(201) });
refuse(clientSchema, "email invalide", { name: "Client", email: "pas-un-email" });
refuse(clientSchema, "siret de 13 chiffres", { name: "Client", siret: "1234567890001" });
refuse(clientSchema, "siret avec lettres", { name: "Client", siret: "1234567890001A" });
refuse(clientSchema, "zip « 7501 » (4 chiffres)", { name: "Client", zip: "7501" });
refuse(clientSchema, "adresse de 301 caractères", { name: "Client", address: "a".repeat(301) });

/* ═══════════ Contrôles négatifs — paramètres émetteur ═══════════ */
console.log("— Contrôles négatifs : paramètres —");

refuse(settingsSchema, "vatMode « tva20 »", { legalName: "Studio", vatMode: "tva20" });
refuse(settingsSchema, "vatMode 42", { vatMode: 42 });
refuse(settingsSchema, "siret de 13 chiffres", { siret: "9876543210001" });
refuse(settingsSchema, "iban trop court", { iban: "FR76" });
refuse(settingsSchema, "iban avec caractères interdits", { iban: "FR76-3000-6000" });
refuse(settingsSchema, "zip « 750 » ", { zip: "750" });
refuse(settingsSchema, "raison sociale de 201 caractères", { legalName: "a".repeat(201) });

/* ═══════════ Contrôles négatifs — inscription ═══════════ */
console.log("— Contrôles négatifs : inscription —");

refuse(registerSchema, "mot de passe de 9 caractères", {
  email: "a@b.fr",
  password: "Test1234!",
  name: "Utilisateur",
});
refuse(registerSchema, "mot de passe vide", { email: "a@b.fr", password: "", name: "U" });
refuse(registerSchema, "mot de passe de 129 caractères", {
  email: "a@b.fr",
  password: "x".repeat(129),
  name: "U",
});
refuse(registerSchema, "email invalide", {
  email: "sophie(at)exemple.fr",
  password: "Test1234!Factiq",
  name: "U",
});
refuse(registerSchema, "email de 201 caractères", {
  email: `${"a".repeat(193)}@exemple.fr`,
  password: "Test1234!Factiq",
  name: "U",
});
refuse(registerSchema, "nom vide", { email: "a@b.fr", password: "Test1234!Factiq", name: "  " });

/* ═══════════ Contrôles négatifs — PATCH statut ═══════════ */
console.log("— Contrôles négatifs : PATCH statut —");

refuse(invoicePatchSchema, "statut « banana »", { status: "banana" });
refuse(invoicePatchSchema, "statut absent", {});
refuse(invoicePatchSchema, "champ inconnu (objet strict)", { status: "paid", number: "FAC-2026-0001" });
refuse(invoicePatchSchema, "corps non objet", "paid");

if (failures > 0) {
  console.error(`\n${failures} échec(s) de validation.`);
  process.exit(1);
}
console.log("validations verified");
