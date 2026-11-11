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
  await db.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
