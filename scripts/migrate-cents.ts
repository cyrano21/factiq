#!/usr/bin/env bun
/**
 * Migration « centimes entiers » de la base Factiq — SQL brut, SANS perte.
 *
 * Interdiction absolue (AGENTS.md) : `prisma db push --accept-data-loss`.
 * Ici : reconstruction des tables avec conversion explicite
 *   unitPrice  REAL  → unitPriceCents     INTEGER = ROUND(unitPrice × 100)
 *   vatRate    REAL  → vatRateCentiemes   INTEGER = ROUND(vatRate × 100)
 * (quantity reste REAL : grandeur non monétaire, heures fractionnaires.)
 *
 * Transaction unique, contrôle des comptes avant/après (exit 1 si divergence),
 * PRAGMA foreign_key_check, IDEMPOTENT (2e exécution = no-op, exit 0).
 *
 * Usage : bun scripts/migrate-cents.ts [chemin-base]
 *   défaut : db/custom.db (relatif à la racine du dépôt)
 *   la surcharge de DATABASE_URL est acceptée si elle pointe un fichier.
 */
import { resolve } from "node:path";
import { existsSync } from "node:fs";
// bun:sqlite n'a pas de types dans le tsconfig Next (build app) : script dev
// exécuté uniquement par bun, hors `tsc --noEmit` du CI applicatif.
// @ts-expect-error — module natif bun (runtime), non résolu par tsc
import { Database } from "bun:sqlite";

function dbPath(): string {
  if (process.argv[2]) return resolve(process.argv[2]);
  const env = process.env.DATABASE_URL;
  if (env?.startsWith("file:")) {
    // Prisma (CLI comme client runtime) résout un chemin file: RELATIF au
    // répertoire de travail du processus — pas au dossier prisma/.
    // Depuis factiq/ avec file:../db/custom.db → /home/z/my-project/db/custom.db.
    return resolve(env.slice(5));
  }
  return resolve("db/custom.db");
}

const path = dbPath();
if (!existsSync(path)) {
  console.error(`migrate-cents : base introuvable : ${path}`);
  process.exit(1);
}
console.log(`migrate-cents : base cible = ${path}`);

const db = new Database(path);
db.run("PRAGMA foreign_keys = OFF");

const column = (table: string, name: string) =>
  db
    .prepare(`SELECT name FROM pragma_table_info(?) WHERE name = ?`)
    .get(table, name);

const already = column("InvoiceLine", "unitPriceCents");
if (already) {
  console.log(`migrate-cents : ${path} est déjà migrée en centimes (no-op).`);
  db.close();
  process.exit(0);
}

if (!column("InvoiceLine", "unitPrice")) {
  console.error("migrate-cents : colonne unitPrice (REAL) introuvable — état inattendu.");
  process.exit(1);
}

const count = (sql: string) =>
  (db.prepare(sql).get() as { n: number }).n;

const invoicesBefore = count(`SELECT COUNT(*) AS n FROM Invoice`);
const linesBefore = count(`SELECT COUNT(*) AS n FROM InvoiceLine`);
const negative = count(`SELECT COUNT(*) AS n FROM InvoiceLine WHERE unitPrice < 0 OR quantity < 0`);
const badRate = count(`SELECT COUNT(*) AS n FROM Invoice WHERE vatRate IS NULL OR vatRate < 0`);
if (negative > 0 || badRate > 0) {
  console.error(
    `migrate-cents : données anormales détectées (${negative} ligne(s) négative(s), ${badRate} taux invalide(s)) — migration refusée, corrigez d'abord.`
  );
  db.close();
  process.exit(1);
}

db.run("BEGIN");
try {
  // 1. Lignes : REAL → centimes entiers.
  db.run(`
    CREATE TABLE "InvoiceLine_new" (
      "id"            TEXT    NOT NULL PRIMARY KEY,
      "invoiceId"     TEXT    NOT NULL,
      "description"   TEXT    NOT NULL,
      "quantity"      REAL    NOT NULL DEFAULT 1,
      "unitPriceCents" INTEGER NOT NULL,
      "sortOrder"     INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  db.run(`
    INSERT INTO "InvoiceLine_new" ("id", "invoiceId", "description", "quantity", "unitPriceCents", "sortOrder")
    SELECT "id", "invoiceId", "description", "quantity",
           CAST(ROUND("unitPrice" * 100) AS INTEGER),
           "sortOrder"
    FROM "InvoiceLine"
  `);
  db.run(`DROP TABLE "InvoiceLine"`);
  db.run(`ALTER TABLE "InvoiceLine_new" RENAME TO "InvoiceLine"`);

  // 2. Factures : taux REAL → centièmes de pourcentage entiers (20 % → 2000).
  db.run(`
    CREATE TABLE "Invoice_new" (
      "id"               TEXT    NOT NULL PRIMARY KEY,
      "userId"           TEXT    NOT NULL,
      "clientId"         TEXT    NOT NULL,
      "number"           TEXT    NOT NULL,
      "issueDate"        TEXT    NOT NULL,
      "dueDate"          TEXT    NOT NULL,
      "status"           TEXT    NOT NULL DEFAULT 'draft',
      "currency"         TEXT    NOT NULL DEFAULT 'EUR',
      "vatRateCentiemes" INTEGER NOT NULL DEFAULT 2000,
      "vatMode"          TEXT    NOT NULL DEFAULT 'standard',
      "paymentTerms"     TEXT    NOT NULL DEFAULT 'Paiement à 30 jours',
      "notes"            TEXT,
      "createdAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  db.run(`
    INSERT INTO "Invoice_new" ("id", "userId", "clientId", "number", "issueDate", "dueDate", "status", "currency", "vatRateCentiemes", "vatMode", "paymentTerms", "notes", "createdAt")
    SELECT "id", "userId", "clientId", "number", "issueDate", "dueDate", "status", "currency",
           CAST(ROUND("vatRate" * 100) AS INTEGER),
           "vatMode", "paymentTerms", "notes", "createdAt"
    FROM "Invoice"
  `);
  db.run(`DROP TABLE "Invoice"`);
  db.run(`ALTER TABLE "Invoice_new" RENAME TO "Invoice"`);

  // 3. Index uniques (reproduits du schéma Prisma).
  db.run(`CREATE UNIQUE INDEX "Invoice_userId_number_key" ON "Invoice"("userId", "number")`);
  db.run(`CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId")`);

  db.run("COMMIT");
} catch (e) {
  db.run("ROLLBACK");
  console.error(`migrate-cents : échec, rollback effectué : ${e}`);
  db.close();
  process.exit(1);
}

const invoicesAfter = count(`SELECT COUNT(*) AS n FROM Invoice`);
const linesAfter = count(`SELECT COUNT(*) AS n FROM InvoiceLine`);
const fkIssues = count(`SELECT COUNT(*) AS n FROM pragma_foreign_key_check`);
const typeOk = count(`
  SELECT COUNT(*) AS n FROM pragma_table_info('InvoiceLine') WHERE name = 'unitPriceCents' AND upper(type) = 'INTEGER'
`);
const rateTypeOk = count(`
  SELECT COUNT(*) AS n FROM pragma_table_info('Invoice') WHERE name = 'vatRateCentiemes' AND upper(type) = 'INTEGER'
`);

console.log(
  `migrate-cents : factures ${invoicesBefore}→${invoicesAfter}, lignes ${linesBefore}→${linesAfter}, ` +
    `clés étrangères ${fkIssues} anomalie(s), types INTEGER ${typeOk && rateTypeOk ? "OK" : "ANOMALIE"}`
);

db.close();

if (invoicesAfter !== invoicesBefore || linesAfter !== linesBefore) {
  console.error("migrate-cents : DIVERGENCE de comptes — investigate immediately");
  process.exit(1);
}
if (fkIssues !== 0 || !typeOk || !rateTypeOk) {
  console.error("migrate-cents : anomalies structurelles post-migration");
  process.exit(1);
}
console.log("migrate-cents : OK");
