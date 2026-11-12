import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.userId !== user.id) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }
  const b = await req.json();
  const status = ["draft", "sent", "paid"].includes(String(b.status))
    ? String(b.status)
    : invoice.status;
  // Une facture émise (sent) ou payée (paid) ne peut pas revenir en brouillon :
  // sa numérotation engage la continuité de l'historique comptable.
  if (invoice.status !== "draft" && status === "draft") {
    return NextResponse.json(
      { error: "Une facture émise ne peut pas revenir au statut brouillon." },
      { status: 409 }
    );
  }
  const updated = await db.invoice.update({ where: { id }, data: { status } });
  return NextResponse.json({ invoice: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.userId !== user.id) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }
  // Pièce comptable : une facture émise est conservée 10 ans (art. L123-22 du
  // code de commerce). Seuls les brouillons peuvent être supprimés ; une
  // erreur s'annule par un avoir, jamais par une destruction.
  if (invoice.status !== "draft") {
    return NextResponse.json(
      {
        error:
          "Une facture émise est une pièce comptable conservée 10 ans : elle ne peut pas être supprimée. Établissez un avoir pour annuler.",
      },
      { status: 409 }
    );
  }
  await db.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
