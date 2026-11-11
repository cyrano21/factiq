import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, publicUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const b = await req.json();
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        legalName: b.legalName != null ? String(b.legalName).trim() : user.legalName,
        siret: b.siret != null ? String(b.siret).replace(/\s+/g, "") : user.siret,
        vatNumber: b.vatNumber != null ? String(b.vatNumber).trim() : user.vatNumber,
        address: b.address != null ? String(b.address).trim() : user.address,
        zip: b.zip != null ? String(b.zip).trim() : user.zip,
        city: b.city != null ? String(b.city).trim() : user.city,
        iban: b.iban != null ? String(b.iban).replace(/\s+/g, "") : user.iban,
        vatMode: b.vatMode === "franchise" || b.vatMode === "standard" ? b.vatMode : user.vatMode,
      },
    });
    return NextResponse.json({ user: publicUser(updated) });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
