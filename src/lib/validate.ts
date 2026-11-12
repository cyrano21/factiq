/**
 * Schémas de validation des entrées (zod v4) pour les routes d'écriture de
 * l'API Factiq. Tous les messages sont en français et conçus pour être
 * affichés tels quels à l'utilisateur (toast, champ d'erreur).
 *
 * Principes :
 * - la validation du corps passe AVANT toute logique métier (limite du plan
 *   gratuit, ownership du client, numérotation serveur) ;
 * - les champs texte vides ("") envoyés par les formulaires sont traités
 *   comme absents — sauf sur /api/settings où "" signifie explicitement
 *   « effacer la valeur » (sémantique historique du PATCH émetteur) ;
 * - le numéro de facture n'est jamais lu depuis le client : il est généré
 *   par le serveur (compteur persistant, voir invoice-service.ts).
 */

import { z } from "zod";

/* ────────────────────────── Bornes métier ────────────────────────── */

/** Bornes partagées entre les schémas, les routes et les tests. */
export const LIMITS = {
  /** Nombre maximal de lignes par facture. */
  maxLines: 200,
  /** Quantité maximale par ligne (unités) — grandeur NON monétaire. */
  quantityMax: 1_000_000,
  /** Prix unitaire maximal en CENTIMES (1 000 000 000 € = 10¹¹ c). */
  unitPriceCentsMax: 100_000_000_000,
  /** Taux de TVA maximal en CENTIÈMES de pourcentage (100 % → 10 000). */
  vatRateCentiemesMax: 10_000,
  /** Longueurs maximales des champs texte. */
  descriptionMax: 500,
  paymentTermsMax: 300,
  notesMax: 2000,
  clientNameMax: 200,
  emailMax: 200,
  addressMax: 300,
  zipMax: 10,
  cityMax: 100,
  vatNumberMax: 20,
  legalNameMax: 200,
  ibanMax: 40,
  passwordMin: 10,
  passwordMax: 128,
  registerNameMax: 100,
} as const;

/* ──────────────────── Montants : centimes entiers (Int) ────────────────────
 * Refonte « centimes » (AGENTS.md §2) : l'API n'accepte que des ENTIERS en
 * centimes — `unitPriceCents` (12,30 € → 1230) et `vatRateCentiemes`
 * (20 % → 2000, 5,5 % → 550). Tout montant Float est refusé : aucune
 * réinterprétation silencieuse. La saisie utilisateur FR (« 12,30 ») est
 * convertie côté client via toCents() (src/lib/money.ts).
 */

const numberSchema = (message: string) => z.number({ message });

/** Quantité d'une ligne : strictement positive et bornée (> 0 et ≤ 1 000 000). */
export const quantitySchema = numberSchema(
  "La quantité d'une ligne doit être un nombre."
)
  .positive("La quantité d'une ligne doit être strictement positive.")
  .max(
    LIMITS.quantityMax,
    `La quantité d'une ligne ne peut pas dépasser ${LIMITS.quantityMax.toLocaleString("fr-FR")}.`
  );

/** Prix unitaire en CENTIMES d'euro : entier, ≥ 0, borné (10⁹ € max). */
export const unitPriceCentsSchema = numberSchema(
  "Le prix unitaire doit être un nombre entier de centimes (ex. 1230 pour 12,30 €)."
)
  .int("Le prix unitaire doit être un nombre ENTIER de centimes (ex. 1230 pour 12,30 €) — plus aucun montant décimal n'est accepté.")
  .min(0, "Le prix unitaire d'une ligne ne peut pas être négatif.")
  .max(
    LIMITS.unitPriceCentsMax,
    `Le prix unitaire d'une ligne ne peut pas dépasser ${(LIMITS.unitPriceCentsMax / 100).toLocaleString("fr-FR")} €.`
  );

/** Taux de TVA en CENTIÈMES de pourcentage : entier, 0 → 10 000 (100 %). */
export const vatRateCentiemesSchema = numberSchema(
  "Le taux de TVA doit être un nombre entier de centièmes de pourcentage (ex. 2000 pour 20 %)."
)
  .int("Le taux de TVA doit être un nombre entier de centièmes de pourcentage (ex. 2000 pour 20 %, 550 pour 5,5 %).")
  .min(
    0,
    `Le taux de TVA doit être compris entre 0 et ${LIMITS.vatRateCentiemesMax / 100} %.`
  )
  .max(
    LIMITS.vatRateCentiemesMax,
    `Le taux de TVA doit être compris entre 0 et ${LIMITS.vatRateCentiemesMax / 100} %.`
  );

/* ────────────────────────── Sous-schémas réutilisables ────────────────────────── */

const GENERIC_TEXT_TYPE_MESSAGE = "Cette valeur doit être une chaîne de caractères.";
const SIRET_MESSAGE = "Le SIRET doit contenir exactement 14 chiffres.";
const ZIP_MESSAGE = "Le code postal doit contenir 5 chiffres.";
const IBAN_MESSAGE =
  "L'IBAN doit contenir entre 10 et 34 caractères alphanumériques (majuscules).";

/** Champ texte optionnel : trim, et "" (champ laissé vide du formulaire)
 * devient absent — la route applique alors sa valeur par défaut historique. */
const optionalText = (max: number, tooLong: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v),
    z.string({ message: GENERIC_TEXT_TYPE_MESSAGE }).max(max, tooLong).optional()
  );

/** Comme optionalText, mais CONSERVE la chaîne vide : les paramètres émetteur
 * (/api/settings) utilisent "" pour « effacer la valeur » — un champ présent
 * mais vide est écrit tel quel, comme avant l'introduction des schémas. */
const optionalTextOrEmpty = (max: number, tooLong: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string({ message: GENERIC_TEXT_TYPE_MESSAGE }).max(max, tooLong).optional()
  );

/** Adresse e-mail optionnelle : trim, "" = absent, format vérifié. */
const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v),
  z
    .string({ message: "Adresse e-mail invalide." })
    .max(LIMITS.emailMax, `L'adresse e-mail ne peut pas dépasser ${LIMITS.emailMax} caractères.`)
    .pipe(z.email({ message: "Adresse e-mail invalide." }))
    .optional()
);

/** Adresse e-mail requise (inscription) : trim puis format vérifié. */
const requiredEmail = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z
    .string({ message: "Adresse e-mail invalide." })
    .min(1, "Adresse e-mail invalide.")
    .max(LIMITS.emailMax, `L'adresse e-mail ne peut pas dépasser ${LIMITS.emailMax} caractères.`)
    .pipe(z.email({ message: "Adresse e-mail invalide." }))
);

/** SIRET optionnel (client) : les espaces sont retirés puis 14 chiffres
 * exigés ; un champ vide reste absent (stocké NULL). */
const optionalSiret = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const digits = v.replace(/\s+/g, "");
    return digits === "" ? undefined : digits;
  },
  z
    .string({ message: SIRET_MESSAGE })
    .regex(/^\d{14}$/, SIRET_MESSAGE)
    .optional()
);

/** SIRET optionnel (paramètres émetteur) : "" est conservé (efface la
 * valeur), sinon les espaces sont retirés puis 14 chiffres exigés. */
const optionalSiretOrEmpty = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/\s+/g, "") : v),
  z
    .string({ message: SIRET_MESSAGE })
    .refine((v) => v === "" || /^\d{14}$/.test(v), { message: SIRET_MESSAGE })
    .optional()
);

/** Code postal optionnel (client) : "" = absent, sinon 5 chiffres. */
const optionalZip = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v),
  z.string({ message: ZIP_MESSAGE }).regex(/^\d{5}$/, ZIP_MESSAGE).optional()
);

/** Code postal optionnel (paramètres émetteur) : "" conservé (efface), sinon
 * 5 chiffres. */
const optionalZipOrEmpty = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z
    .string({ message: ZIP_MESSAGE })
    .refine((v) => v === "" || /^\d{5}$/.test(v), { message: ZIP_MESSAGE })
    .optional()
);

/** IBAN optionnel (paramètres émetteur) : "" conservé (efface), sinon les
 * espaces sont retirés, mise en majuscules, puis format souple vérifié
 * (10 à 34 caractères alphanumériques — contrôle pays/CRC hors périmètre). */
const optionalIbanOrEmpty = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/\s+/g, "").toUpperCase() : v),
  z
    .string({ message: IBAN_MESSAGE })
    .refine((v) => v === "" || /^[A-Z0-9]{10,34}$/.test(v), { message: IBAN_MESSAGE })
    .optional()
);

/** Date ISO courte AAAA-MM-JJ, calendairement valide, optionnelle.
 * Date.parse seul est insuffisant : il accepte « 2026-02-31 » (reporté au
 * 3 mars) et des formats exotiques ; on vérifie donc l'aller-retour sur les
 * composantes UTC après le découpage. */
const isValidCalendarDate = (value: string): boolean => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const isoDateSchema = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string({ message: `${label} doit être une date au format AAAA-MM-JJ.` })
      .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} doit être au format AAAA-MM-JJ (ex. 2026-05-12).`)
      .refine(isValidCalendarDate, {
        message: `${label} n'est pas une date valide (jour ou mois inexistant).`,
      })
      .optional()
  );

/* ────────────────────────── Lignes de facture ────────────────────────── */

const lineSchema = z.object(
  {
    /** Désignation trimée : 1 à 500 caractères. */
    description: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string({ message: "Chaque ligne doit avoir une désignation." })
        .min(1, "Chaque ligne doit avoir une désignation.")
        .max(
          LIMITS.descriptionMax,
          `La désignation d'une ligne ne peut pas dépasser ${LIMITS.descriptionMax} caractères.`
        )
    ),
    quantity: quantitySchema,
    unitPriceCents: unitPriceCentsSchema,
  },
  { message: "Ligne de facture invalide." }
);

/* ────────────────────────── Schémas exposés ────────────────────────── */

/**
 * Corps du POST /api/invoices. Les dates sont optionnelles : le serveur pose
 * ses défauts (aujourd'hui / +30 jours). Le champ `number` éventuel du client
 * est ignoré : la numérotation est TOUJOURS générée par le serveur.
 */
export const invoiceCreateSchema = z
  .object(
    {
      /** Identifiant d'un client appartenant à l'utilisateur (l'ownership
       * reste vérifié dans la route). */
      clientId: z
        .string({ message: "Le client est requis." })
        .min(1, "Le client est requis."),
      issueDate: isoDateSchema("La date d'émission"),
      dueDate: isoDateSchema("La date d'échéance"),
      vatRateCentiemes: vatRateCentiemesSchema.optional(),
      vatMode: z.enum(["standard", "franchise"], {
        message: "Le régime de TVA doit être « standard » ou « franchise ».",
      }).optional(),
      paymentTerms: optionalText(
        LIMITS.paymentTermsMax,
        `Les conditions de paiement ne peuvent pas dépasser ${LIMITS.paymentTermsMax} caractères.`
      ),
      notes: optionalText(
        LIMITS.notesMax,
        `Les notes ne peuvent pas dépasser ${LIMITS.notesMax} caractères.`
      ),
      lines: z
        .array(lineSchema, { message: "Les lignes de facture doivent être une liste." })
        .min(1, "Ajoutez au moins une ligne avec désignation et quantité.")
        .max(
          LIMITS.maxLines,
          `Une facture ne peut pas contenir plus de ${LIMITS.maxLines} lignes.`
        ),
    },
    { message: "Corps de requête invalide." }
  )
  .refine(
    (v) => !v.issueDate || !v.dueDate || v.dueDate >= v.issueDate,
    { message: "La date d'échéance ne peut pas être antérieure à la date d'émission." }
  );

/**
 * Corps du PATCH /api/invoices/[id] : le corps ne transporte QUE le statut
 * cible. Décision documentée : les champs inconnus sont REJETÉS (objet
 * strict) — un PATCH doit exprimer une intention claire et unique ; les
 * transitions elles-mêmes (forward-only) sont arbitées dans la route.
 */
export const invoicePatchSchema = z.strictObject(
  {
    status: z.enum(["draft", "sent", "paid"], {
      message: "Le statut doit être « draft », « sent » ou « paid ».",
    }),
  },
  { message: "Seul le champ « status » (draft, sent ou paid) est accepté." }
);

/**
 * Corps du POST /api/clients. Les champs vides ("") sont stockés NULL, comme
 * avant l'introduction des schémas ; les formats (e-mail, SIRET, code
 * postal) sont désormais vérifiés.
 */
export const clientSchema = z.object(
  {
    name: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string({ message: "Le nom du client est requis." })
        .min(1, "Le nom du client est requis.")
        .max(
          LIMITS.clientNameMax,
          `Le nom du client ne peut pas dépasser ${LIMITS.clientNameMax} caractères.`
        )
    ),
    email: optionalEmail,
    address: optionalText(
      LIMITS.addressMax,
      `L'adresse ne peut pas dépasser ${LIMITS.addressMax} caractères.`
    ),
    zip: optionalZip,
    city: optionalText(
      LIMITS.cityMax,
      `La ville ne peut pas dépasser ${LIMITS.cityMax} caractères.`
    ),
    siret: optionalSiret,
    vatNumber: optionalText(
      LIMITS.vatNumberMax,
      `Le numéro de TVA intracommunautaire ne peut pas dépasser ${LIMITS.vatNumberMax} caractères.`
    ),
  },
  { message: "Corps de requête invalide." }
);

/**
 * Corps du PATCH /api/settings (identité émettrice). Tous les champs sont
 * optionnels : absent = conserver la valeur actuelle ; "" = effacer la
 * valeur (sémantique historique) ; valeur non vide = validée puis écrite.
 * `city` est validée en plus du contrat initial : le panneau paramètres
 * l'envoie et la route l'écrit — la laisser hors bornes aurait été un trou.
 */
export const settingsSchema = z.object(
  {
    legalName: optionalTextOrEmpty(
      LIMITS.legalNameMax,
      `La raison sociale ne peut pas dépasser ${LIMITS.legalNameMax} caractères.`
    ),
    siret: optionalSiretOrEmpty,
    vatNumber: optionalTextOrEmpty(
      LIMITS.vatNumberMax,
      `Le numéro de TVA intracommunautaire ne peut pas dépasser ${LIMITS.vatNumberMax} caractères.`
    ),
    address: optionalTextOrEmpty(
      LIMITS.addressMax,
      `L'adresse ne peut pas dépasser ${LIMITS.addressMax} caractères.`
    ),
    zip: optionalZipOrEmpty,
    city: optionalTextOrEmpty(
      LIMITS.cityMax,
      `La ville ne peut pas dépasser ${LIMITS.cityMax} caractères.`
    ),
    iban: optionalIbanOrEmpty,
    vatMode: z.enum(["standard", "franchise"], {
      message: "Le régime de TVA doit être « standard » ou « franchise ».",
    }).optional(),
  },
  { message: "Corps de requête invalide." }
);

/**
 * Corps du POST /api/auth/register. Le mot de passe n'est JAMAIS trimpé ni
 * transformé (secret brut) : 10 à 128 caractères.
 */
export const registerSchema = z.object(
  {
    email: requiredEmail,
    password: z
      .string({ message: `Le mot de passe doit contenir au moins ${LIMITS.passwordMin} caractères.` })
      .min(
        LIMITS.passwordMin,
        `Le mot de passe doit contenir au moins ${LIMITS.passwordMin} caractères.`
      )
      .max(
        LIMITS.passwordMax,
        `Le mot de passe ne peut pas dépasser ${LIMITS.passwordMax} caractères.`
      ),
    name: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string({ message: "Le nom est requis." })
        .min(1, "Le nom est requis.")
        .max(
          LIMITS.registerNameMax,
          `Le nom ne peut pas dépasser ${LIMITS.registerNameMax} caractères.`
        )
    ),
  },
  { message: "Corps de requête invalide." }
);

/* ────────────────────────── Helper de réponse HTTP ────────────────────────── */

/** Résultat exploitable par une route : ok, ou premier message français. */
export type HttpValidation = { ok: true } | { ok: false; firstError: string };

type SafeParseLike =
  | { success: true }
  | { success: false; error: { issues: readonly { message?: unknown }[] } };

/**
 * Convertit un résultat de `schema.safeParse(...)` en verdict HTTP :
 * - `{ ok: true }` lorsque le corps est valide ;
 * - `{ ok: false, firstError: "<message français>" }` sinon, avec le message
 *   du PREMIER problème (ordre des champs du schéma), prêt à être renvoyé
 *   tel quel dans la réponse 400.
 */
export function httpError(result: SafeParseLike): HttpValidation {
  if (result.success) return { ok: true };
  const raw = result.error.issues[0]?.message;
  const message = typeof raw === "string" ? raw.trim() : "";
  return {
    ok: false,
    firstError: message.length > 0 ? message : "Données invalides.",
  };
}
