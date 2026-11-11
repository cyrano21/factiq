import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FREE_INVOICE_LIMIT, nextInvoiceNumber } from "@/lib/invoice-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const invoices = await db.invoice.findMany({
    where: { userId: user.id },
    include: { client: true, lines: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invoices });
}

type LineInput = { description: string; quantity: number; unitPrice: number };

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    if (user.plan === "free") {
      const count = await db.invoice.count({ where: { userId: user.id } });
      if (count >= FREE_INVOICE_LIMIT) {
        return NextResponse.json(
          {
            error: `Limite du plan Gratuit atteinte (${FREE_INVOICE_LIMIT} factures). Passez au plan Pro pour la facturation illimitée.`,
            code: "LIMIT_REACHED",
          },
          { status: 402 }
        );
      }
    }

    const b = await req.json();
    const clientId = String(b.clientId ?? "");
    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client || client.userId !== user.id) {
      return NextResponse.json({ error: "Client invalide." }, { status: 400 });
    }

    const lines: LineInput[] = Array.isArray(b.lines)
      ? b.lines
          .map((l: LineInput) => ({
            description: String(l.description ?? "").trim(),
            quantity: Number(l.quantity) || 0,
            unitPrice: Number(l.unitPrice) || 0,
          }))
          .filter((l: LineInput) => l.description && l.quantity > 0)
      : [];
    if (lines.length === 0) {
      return NextResponse.json(
        { error: "Ajoutez au moins une ligne avec désignation et quantité." },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const plus30 = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const vatMode = b.vatMode === "franchise" ? "franchise" : user.vatMode;

    const invoice = await db.invoice.create({
      data: {
        userId: user.id,
        clientId,
        number: await nextInvoiceNumber(user.id),
        issueDate: b.issueDate ? String(b.issueDate) : today,
        dueDate: b.dueDate ? String(b.dueDate) : plus30,
        status: "draft",
        currency: "EUR",
        vatRate: vatMode === "franchise" ? 0 : Number(b.vatRate) || 20,
        vatMode,
        paymentTerms: b.paymentTerms ? String(b.paymentTerms) : "Paiement à 30 jours",
        notes: b.notes ? String(b.notes) : null,
        lines: {
          create: lines.map((l: LineInput, i: number) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            sortOrder: i,
          })),
        },
      },
      include: { lines: true, client: true },
    });
    return NextResponse.json({ invoice });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
