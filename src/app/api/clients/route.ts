import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    const b = await req.json();
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Le nom du client est requis." }, { status: 400 });
    const client = await db.client.create({
      data: {
        userId: user.id,
        name,
        email: b.email ? String(b.email).trim() : null,
        address: b.address ? String(b.address).trim() : null,
        zip: b.zip ? String(b.zip).trim() : null,
        city: b.city ? String(b.city).trim() : null,
        siret: b.siret ? String(b.siret).replace(/\s+/g, "") : null,
        vatNumber: b.vatNumber ? String(b.vatNumber).trim() : null,
      },
    });
    return NextResponse.json({ client });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
