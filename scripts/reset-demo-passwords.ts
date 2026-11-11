/**
 * Réinitialise les mots de passe des comptes de démonstration (hash scrypt,
 * même format que src/lib/auth.ts) pour les rendre utilisables en démo.
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
  for (const email of ["sophie@demo.fr", "claire@demo.fr"]) {
    const u = await db.user.update({
      where: { email },
      data: { passwordHash: hashPassword("demo1234") },
    });
    console.log(`✓ ${email} → mot de passe réinitialisé (demo1234) [${u.name}]`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
