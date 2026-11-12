#!/usr/bin/env bun
/**
 * check-migration-applied.mjs — gate N2 de node-1.2 (driver).
 * Vérifie que la VRAIE base (celle que Prisma utilise, résolue depuis le CWD)
 * est migrée (colonnes INTEGER), qu'un backup horodaté existe dans db/, que
 * les valeurs échantillons sont des centimes plausibles et que le script de
 * migration est en no-op (idempotent).
 * Succès : « migration applied » (exit 0).
 */
import { Database } from "bun:sqlite";
// @ts-expect-error — module natif bun (runtime)
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`❌ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

// Même résolution que Prisma : file:../db/custom.db depuis le CWD factiq/.
const env = process.env.DATABASE_URL ?? "file:../db/custom.db";
const realPath = resolve(env.startsWith("file:") ? env.slice(5) : env);
const db = new Database(realPath, { readonly: true });
console.log(`  base réelle : ${realPath}`);

const lineType = db
  .prepare("SELECT type FROM pragma_table_info('InvoiceLine') WHERE name = 'unitPriceCents'")
  .get();
const rateType = db
  .prepare("SELECT type FROM pragma_table_info('Invoice') WHERE name = 'vatRateCentiemes'")
  .get();
const oldUnit = db.prepare("SELECT name FROM pragma_table_info('InvoiceLine') WHERE name = 'unitPrice'").get();
const oldRate = db.prepare("SELECT name FROM pragma_table_info('Invoice') WHERE name = 'vatRate'").get();
if (!lineType || lineType.type.toUpperCase() !== "INTEGER") fail("unitPriceCents absent ou non INTEGER dans la base réelle");
if (!rateType || rateType.type.toUpperCase() !== "INTEGER") fail("vatRateCentiemes absent ou non INTEGER dans la base réelle");
if (oldUnit) fail("l'ancienne colonne unitPrice (REAL) existe encore");
if (oldRate) fail("l'ancienne colonne vatRate (REAL) existe encore");

const counts = db
  .prepare("SELECT (SELECT COUNT(*) FROM Invoice) i, (SELECT COUNT(*) FROM InvoiceLine) l")
  .get();
const sample = db.prepare("SELECT unitPriceCents FROM InvoiceLine LIMIT 20").all();
for (const row of sample) {
  if (!Number.isInteger(row.unitPriceCents) || row.unitPriceCents < 0) {
    fail(`valeur non entière/non négative : ${JSON.stringify(row)}`);
    break;
  }
}
ok(`types INTEGER + ${counts.i} factures / ${counts.l} lignes, centimes plausibles`);
db.close();

// Backups horodatés présents dans db/ (avant et/ou après migration).
const dbDir = resolve("db");
const backups = readdirSync(dbDir).filter(
  (f) => f.startsWith("custom.db.backup-") || f.startsWith("custom.db.post-migration-cents-")
);
if (backups.length === 0) fail("aucun backup horodaté dans db/");
for (const b of backups) {
  const st = statSync(resolve(dbDir, b));
  if (st.size === 0) fail(`backup vide : ${b}`);
}
ok(`backups horodatés présents : ${backups.join(", ")}`);

// Idempotence sur la vraie base : no-op garanti.
const proc = Bun.spawnSync(["bun", "scripts/migrate-cents.ts"], {
  cwd: resolve(import.meta.dir, ".."),
  stdout: "pipe",
  stderr: "pipe",
});
const out = `${proc.stdout.toString()}${proc.stderr.toString()}`;
if (proc.exitCode !== 0 || !out.includes("déjà migrée")) {
  fail(`le script de migration n'est pas en no-op sur la base réelle : ${out.trim()}`);
} else {
  ok("migrate-cents : no-op confirmé sur la base réelle");
}

if (failures > 0) {
  console.error(`check-migration-applied : ${failures} échec(s)`);
  process.exit(1);
}
console.log("migration applied");
