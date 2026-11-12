import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { clientSchema, httpError } from "@/lib/validate";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const clients = await db.client.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    // Validation du corps avant écriture : longueurs bornées et formats
    // vérifiés (e-mail, SIRET 14 chiffres, code postal 5 chiffres) ; un
    // champ vide ("") reste stocké NULL, comme avant les schémas.
    const parsed = clientSchema.safeParse(await req.json().catch(() => null));
    const validation = httpError(parsed);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.firstError }, { status: 400 });
    }
    const data = parsed.data!;
    const client = await db.client.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email ?? null,
        address: data.address ?? null,
        zip: data.zip ?? null,
        city: data.city ?? null,
        siret: data.siret ?? null,
        vatNumber: data.vatNumber ?? null,
      },
    });
    return NextResponse.json({ client });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
