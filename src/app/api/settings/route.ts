import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { httpError, settingsSchema } from "@/lib/validate";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    // Validation du corps : champ absent = conserver la valeur actuelle,
    // "" = effacer la valeur (sémantique historique), sinon valeur validée
    // (formats SIRET / code postal / IBAN, longueurs bornées) puis écrite.
    const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
    const validation = httpError(parsed);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.firstError }, { status: 400 });
    }
    const data = parsed.data!;
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        legalName: data.legalName != null ? data.legalName : user.legalName,
        siret: data.siret != null ? data.siret : user.siret,
        vatNumber: data.vatNumber != null ? data.vatNumber : user.vatNumber,
        address: data.address != null ? data.address : user.address,
        zip: data.zip != null ? data.zip : user.zip,
        city: data.city != null ? data.city : user.city,
        iban: data.iban != null ? data.iban : user.iban,
        vatMode: data.vatMode ?? user.vatMode,
      },
    });
    return NextResponse.json({ user: publicUser(updated) });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
