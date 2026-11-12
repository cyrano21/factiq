#!/usr/bin/env bun
/**
 * Test de la migration centimes sur une COPIE — jamais sur la base réelle.
 *
 * Base de test (par ordre de préférence) :
 *  1. le backup le plus récent db/custom.db.backup-* (copie fidèle de la
 *     vraie base AVANT migration, si la vraie base est déjà migrée) ;
 *  2. la vraie base elle-même, si elle est encore au schéma Float ;
 *  3. à défaut, une fixture synthétique répliquant l'ancien schéma.
 *
 * Vérifications : comptes préservés, types INTEGER, conversion ROUND(x×100)
 * exacte sur échantillon, idempotence (2e exécution no-op).
 * Succès : « migration verified » (exit 0).
 */
import { Database } from "bun:sqlite";
import { copyFileSync, existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`❌ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

// ── Choix de la base de test (ancien schéma Float) ──
function oldSchemaDb(path) {
  if (!existsSync(path)) return null;
  try {
    const db = new Database(path, { readonly: true });
    const col = db
      .prepare("SELECT name FROM pragma_table_info('InvoiceLine') WHERE name = 'unitPrice'")
      .get();
    db.close();
    return col ? path : null;
  } catch {
    return null;
  }
}

function makeFixture(path) {
  const db = new Database(path);
  db.run(`
    CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "vatMode" TEXT NOT NULL DEFAULT 'standard',
      "plan" TEXT NOT NULL DEFAULT 'free', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE "Client" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "name" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE "Invoice" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "clientId" TEXT NOT NULL,
      "number" TEXT NOT NULL, "issueDate" TEXT NOT NULL, "dueDate" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'draft', "currency" TEXT NOT NULL DEFAULT 'EUR',
      "vatRate" REAL NOT NULL DEFAULT 20, "vatMode" TEXT NOT NULL DEFAULT 'standard',
      "paymentTerms" TEXT NOT NULL DEFAULT 'Paiement à 30 jours', "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE "InvoiceLine" ("id" TEXT NOT NULL PRIMARY KEY, "invoiceId" TEXT NOT NULL,
      "description" TEXT NOT NULL, "quantity" REAL NOT NULL DEFAULT 1, "unitPrice" REAL NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE "InvoiceCounter" ("userId" TEXT NOT NULL, "year" INTEGER NOT NULL,
      "lastNumber" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("userId", "year"));
  `);
  db.run(`INSERT INTO User (id, email, name, passwordHash) VALUES ('u1','a@b.fr','A','x')`);
  db.run(`INSERT INTO Client (id, userId, name) VALUES ('c1','u1','Client Test')`);
  db.run(`INSERT INTO Invoice (id, userId, clientId, number, issueDate, dueDate, status, vatRate, vatMode)
          VALUES ('i1','u1','c1','FAC-2026-0001','2026-01-15','2026-02-14','sent',5.5,'standard'),
                 ('i2','u1','c1','FAC-2026-0002','2026-02-01','2026-03-03','draft',20,'standard')`);
  // 12,30 € / 0,10 € / 1 600,00 € : cas d'arrondi et grand montant.
  db.run(`INSERT INTO InvoiceLine (id, invoiceId, description, quantity, unitPrice, sortOrder) VALUES
          ('l1','i1','Prestation',1,12.3,0),
          ('l2','i1','Échantillon',3,0.1,1),
          ('l3','i2','Forfait',2,1600.0,0)`);
  db.run(`INSERT INTO InvoiceCounter (userId, year, lastNumber) VALUES ('u1', 2026, 2)`);
  db.close();
}

const workDir = mkdtempSync(join(tmpdir(), "factiq-mig-"));
let source = oldSchemaDb(resolve("db/custom.db"));
let sourceLabel = "vraie base (encore au schéma Float)";
if (!source) {
  const backups = readdirSync(resolve("db"))
    .filter((f) => f.startsWith("custom.db.backup-"))
    .sort();
  for (const b of backups.reverse()) {
    const p = resolve("db", b);
    if (oldSchemaDb(p)) {
      source = p;
      sourceLabel = `backup réel ${b}`;
      break;
    }
  }
}
if (!source) {
  source = join(workDir, "fixture-old.db");
  makeFixture(source);
  sourceLabel = "fixture synthétique (ancien schéma)";
}
console.log(`  base de test : ${source} (${sourceLabel})`);

// ── Copie de travail ──
const copy = join(workDir, "copy.db");
copyFileSync(source, copy);
const db = new Database(copy);
// La copie peut être ancienne (avant la table InvoiceCounter du P0) :
// les comptes portent uniquement sur les tables présentes.
const hasCounter =
  db.prepare("SELECT name FROM sqlite_master WHERE name = 'InvoiceCounter'").get() != null;
const before = {
  invoices: db.prepare("SELECT COUNT(*) n FROM Invoice").get().n,
  lines: db.prepare("SELECT COUNT(*) n FROM InvoiceLine").get().n,
  counters: hasCounter
    ? db.prepare("SELECT COUNT(*) n FROM InvoiceCounter").get().n
    : null,
  sampleLines: db.prepare("SELECT id, unitPrice FROM InvoiceLine ORDER BY rowid LIMIT 5").all(),
  sampleRates: db.prepare("SELECT id, vatRate FROM Invoice ORDER BY rowid LIMIT 5").all(),
};
db.close();
console.log(
  `  copie : ${copy} (${before.invoices} factures, ${before.lines} lignes${before.counters !== null ? `, ${before.counters} compteur(s)` : ", pas de compteur (base ancienne)"})`
);

// ── Migration sur la copie uniquement ──
const proc = Bun.spawnSync(["bun", "scripts/migrate-cents.ts", copy], {
  cwd: resolve(import.meta.dir, ".."),
  stdout: "pipe",
  stderr: "pipe",
});
console.log(`${proc.stdout.toString()}${proc.stderr.toString()}`.trim());
if (proc.exitCode !== 0) fail(`migration sur copie : exit ${proc.exitCode}`);

const db2 = new Database(copy);
const after = {
  invoices: db2.prepare("SELECT COUNT(*) n FROM Invoice").get().n,
  lines: db2.prepare("SELECT COUNT(*) n FROM InvoiceLine").get().n,
  counters:
    before.counters !== null
      ? db2.prepare("SELECT COUNT(*) n FROM InvoiceCounter").get().n
      : null,
};
if (after.invoices !== before.invoices) fail(`factures : ${before.invoices} → ${after.invoices}`);
if (after.lines !== before.lines) fail(`lignes : ${before.lines} → ${after.lines}`);
if (before.counters !== null && after.counters !== before.counters) {
  fail(`compteurs : ${before.counters} → ${after.counters}`);
}

const lineType = db2
  .prepare("SELECT type FROM pragma_table_info('InvoiceLine') WHERE name = 'unitPriceCents'")
  .get();
const rateType = db2
  .prepare("SELECT type FROM pragma_table_info('Invoice') WHERE name = 'vatRateCentiemes'")
  .get();
if (!lineType || lineType.type.toUpperCase() !== "INTEGER") fail("unitPriceCents n'est pas INTEGER");
if (!rateType || rateType.type.toUpperCase() !== "INTEGER") fail("vatRateCentiemes n'est pas INTEGER");

for (const row of before.sampleLines) {
  const migrated = db2.prepare("SELECT unitPriceCents FROM InvoiceLine WHERE id = ?").get(row.id);
  const expected = Math.round(row.unitPrice * 100);
  if (migrated.unitPriceCents !== expected) {
    fail(`conversion ligne ${row.id} : ${row.unitPrice} → ${migrated.unitPriceCents} (attendu ${expected})`);
  }
}
for (const row of before.sampleRates) {
  const migrated = db2.prepare("SELECT vatRateCentiemes FROM Invoice WHERE id = ?").get(row.id);
  const expected = Math.round(row.vatRate * 100);
  if (migrated.vatRateCentiemes !== expected) {
    fail(`conversion taux ${row.id} : ${row.vatRate} → ${migrated.vatRateCentiemes} (attendu ${expected})`);
  }
}
ok("comptes + types INTEGER + conversions ROUND(x×100) exactes");

// ── Idempotence ──
const proc2 = Bun.spawnSync(["bun", "scripts/migrate-cents.ts", copy], {
  cwd: resolve(import.meta.dir, ".."),
  stdout: "pipe",
  stderr: "pipe",
});
if (proc2.exitCode !== 0) fail(`idempotence : 2e migration exit ${proc2.exitCode}`);
if (!proc2.stdout.toString().includes("déjà migrée")) {
  fail("idempotence : le script n'annonce pas « déjà migrée »");
}
const again = {
  invoices: db2.prepare("SELECT COUNT(*) n FROM Invoice").get().n,
  lines: db2.prepare("SELECT COUNT(*) n FROM InvoiceLine").get().n,
};
if (again.invoices !== before.invoices || again.lines !== before.lines) {
  fail("idempotence : comptes modifiés par la 2e exécution");
}
db2.close();
ok("idempotence (2e exécution no-op)");

if (failures > 0) {
  console.error(`verify-migration : ${failures} échec(s)`);
  process.exit(1);
}
console.log("migration verified");
