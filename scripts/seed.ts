/**
 * Seed de démonstration — crée les comptes démo, clients et factures.
 * Idempotent : peut être relancé sans dupliquer les données.
 *   bun run db:seed
 */
import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  // — Sophie : franchise en base (art. 293 B du CGI) —
  const sophie = await db.user.upsert({
    where: { email: "sophie@demo.fr" },
    update: {},
    create: {
      email: "sophie@demo.fr",
      name: "Sophie Martin",
      passwordHash: hashPassword("demo1234"),
      legalName: "Sophie Martin Consulting",
      siret: "98765432109876",
      vatMode: "franchise",
      plan: "free",
    },
  });

  // — Claire : assujettie TVA 20 % —
  const claire = await db.user.upsert({
    where: { email: "claire@demo.fr" },
    update: {},
    create: {
      email: "claire@demo.fr",
      name: "Claire Fontaine",
      passwordHash: hashPassword("demo1234"),
      legalName: "Studio Claire Fontaine",
      siret: "87654321012345",
      vatNumber: "FR32876543210",
      vatMode: "standard",
      plan: "free",
    },
  });

  const seedInvoices = async (
    userId: string,
    demos: {
      client: { name: string; email: string; address: string; zip: string; city: string; siret: string };
      lines: { description: string; quantity: number; unitPrice: number }[];
      status: string;
    }[]
  ) => {
    let n = (await db.invoice.count({ where: { userId } })) || 0;
    for (const d of demos) {
      const existing = await db.invoice.findFirst({
        where: { userId, client: { name: d.client.name } },
      });
      if (existing) continue;
      n += 1;
      const client = await db.client.create({
        data: { userId, ...d.client },
      });
      const today = new Date();
      const plus30 = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      await db.invoice.create({
        data: {
          userId,
          clientId: client.id,
          number: `FAC-${today.getFullYear()}-${String(n).padStart(4, "0")}`,
          issueDate: today.toISOString().slice(0, 10),
          dueDate: plus30.toISOString().slice(0, 10),
          status: d.status,
          lines: {
            create: d.lines.map((l, i) => ({ ...l, sortOrder: i })),
          },
        },
      });
    }
  };

  await seedInvoices(sophie.id, [
    {
      client: {
        name: "Boulangerie Dupont SAS",
        email: "compta@dupont.fr",
        address: "12 rue de la République",
        zip: "69003",
        city: "Lyon",
        siret: "12345678901234",
      },
      lines: [{ description: "Prestation de conseil", quantity: 3, unitPrice: 450 }],
      status: "draft",
    },
    {
      client: {
        name: "Studio Lumen",
        email: "hello@studiolumen.fr",
        address: "5 avenue des Arts",
        zip: "75011",
        city: "Paris",
        siret: "23456789012345",
      },
      lines: [
        { description: "Identité visuelle", quantity: 1, unitPrice: 1200 },
        { description: "Développement site (3 j)", quantity: 3, unitPrice: 600 },
      ],
      status: "paid",
    },
  ]);

  await seedInvoices(claire.id, [
    {
      client: {
        name: "Café Mercure",
        email: "gestion@cafemercure.fr",
        address: "8 place Verte",
        zip: "33000",
        city: "Bordeaux",
        siret: "34567890123456",
      },
      lines: [{ description: "Refonte menu & supports", quantity: 1, unitPrice: 1600 }],
      status: "sent",
    },
  ]);

  const users = await db.user.count();
  const invoices = await db.invoice.count();
  console.log(`✓ Seed terminé : ${users} utilisateurs, ${invoices} factures.`);
  console.log("  Comptes : sophie@demo.fr / claire@demo.fr — mot de passe : demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
