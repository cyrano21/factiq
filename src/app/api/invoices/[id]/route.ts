import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { httpError, invoicePatchSchema } from "@/lib/validate";

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

  // 1. Validation du corps : uniquement { status: draft | sent | paid }.
  //    Tout autre champ est rejeté (objet strict) avec un message français.
  const parsed = invoicePatchSchema.safeParse(await req.json().catch(() => null));
  const validation = httpError(parsed);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.firstError }, { status: 400 });
  }
  const status = parsed.data!.status;

  // 2. Transitions forward-only (pièces comptables) :
  //    draft → sent | paid   OK
  //    sent  → paid          OK
  //    sent  → draft         409 (facture émise immuable)
  //    paid  → draft | sent  409 (paid est un statut terminal)
  //    X     → X             no-op 200
  if (status === invoice.status) {
    const unchanged = await db.invoice.update({ where: { id }, data: { status } });
    return NextResponse.json({ invoice: unchanged });
  }
  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Une facture payée est un statut terminal : elle ne peut plus être modifiée." },
      { status: 409 }
    );
  }
  if (status === "draft") {
    // Une facture émise (sent) ne peut pas revenir en brouillon : sa
    // numérotation engage la continuité de l'historique comptable.
    return NextResponse.json(
      { error: "Une facture émise ne peut pas revenir au statut brouillon." },
      { status: 409 }
    );
  }
  // Transitions restantes autorisées : draft→sent, draft→paid, sent→paid.
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
