import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id } });
  if (!client || client.userId !== user.id) {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }
  // Pièce comptable : une facture émise (sent | paid) est conservée 10 ans
  // (art. L123-22 du code de commerce). Supprimer un client détruirait ses
  // factures par cascade — interdit dès qu'une facture émise existe. Les
  // brouillons seuls sont destructibles (supprimables un par un ailleurs).
  const emitted = await db.invoice.count({
    where: { clientId: id, status: { not: "draft" } },
  });
  if (emitted > 0) {
    return NextResponse.json(
      {
        error:
          "Ce client a des factures émises : la suppression est impossible, les factures émises sont des pièces comptables conservées 10 ans. Établissez un avoir pour annuler une facture.",
      },
      { status: 409 }
    );
  }
  await db.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
