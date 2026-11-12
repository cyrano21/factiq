/**
 * Initialise les compteurs de numérotation (InvoiceCounter) à partir des
 * factures existantes : lastNumber = max des numéros FAC-AAAA-NNNN par
 * utilisateur et par année. À exécuter une fois après l'introduction de la
 * table (db:push), avant de remettre le service en écriture.
 *
 * Usage : bun scripts/migrate-counters.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const invoices = await db.invoice.findMany({
    select: { userId: true, number: true },
  });
  const maxByUserYear = new Map<string, number>();
  for (const { userId, number } of invoices) {
    const m = /^FAC-(\d{4})-(\d+)$/.exec(number);
    if (!m) continue;
    const year = Number(m[1]);
    const seq = Number(m[2]);
    const key = `${userId}:${year}`;
    maxByUserYear.set(key, Math.max(maxByUserYear.get(key) ?? 0, seq));
  }

  let created = 0;
  for (const [key, lastNumber] of maxByUserYear) {
    const [userId, yearStr] = key.split(":");
    const year = Number(yearStr);
    await db.invoiceCounter.upsert({
      where: { userId_year: { userId, year } },
      update: { lastNumber },
      create: { userId, year, lastNumber },
    });
    created++;
    console.log(`Compteur initialisé : user ${userId} ${year} → FAC-${year}-${String(lastNumber).padStart(4, "0")}`);
  }
  console.log(`Terminé : ${created} compteur(s), ${invoices.length} facture(s) analysée(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
