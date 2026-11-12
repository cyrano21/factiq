import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FREE_INVOICE_LIMIT, nextInvoiceNumber } from "@/lib/invoice-service";
import { httpError, invoiceCreateSchema } from "@/lib/validate";

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

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    // 1. Validation du corps (schéma zod) AVANT toute logique métier : un
    //    payload invalide est refusé 400 avec le premier message français.
    const parsed = invoiceCreateSchema.safeParse(await req.json().catch(() => null));
    const validation = httpError(parsed);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.firstError }, { status: 400 });
    }
    const data = parsed.data!;

    // 2. Logique métier inchangée pour les payloads valides.
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

    const clientId = data.clientId;
    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client || client.userId !== user.id) {
      return NextResponse.json({ error: "Client invalide." }, { status: 400 });
    }

    const lines = data.lines; // validées par le schéma : 1 à 200 lignes propres
    const today = new Date().toISOString().slice(0, 10);
    const plus30 = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const vatMode = data.vatMode === "franchise" ? "franchise" : user.vatMode;
    // Le numéro venu du client, s'il existait, a été écarté par le schéma :
    // la numérotation reste exclusivement serveur (compteur persistant).
    // Taux en centièmes de pourcentage (20 % → 2000, 5,5 % → 550) ; franchise = 0.
    const vatRateCentiemes = vatMode === "franchise" ? 0 : (data.vatRateCentiemes ?? 2000);

    // Course sur la numérotation : l'index unique (userId, number) arbitre.
    // 3 tentatives en régénérant le numéro (pratique courante en compta).
    const createOne = (number: string) =>
      db.invoice.create({
        data: {
          userId: user.id,
          clientId,
          number,
          issueDate: data.issueDate ?? today,
          dueDate: data.dueDate ?? plus30,
          status: "draft",
          currency: "EUR",
          vatRateCentiemes,
          vatMode,
          paymentTerms: data.paymentTerms ?? "Paiement à 30 jours",
          notes: data.notes ?? null,
          lines: {
            create: lines.map((l, i: number) => ({
              description: l.description,
              quantity: l.quantity,
              unitPriceCents: l.unitPriceCents,
              sortOrder: i,
            })),
          },
        },
        include: { lines: true, client: true },
      });

    let invoice: Awaited<ReturnType<typeof createOne>> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        invoice = await createOne(await nextInvoiceNumber(user.id));
        break;
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code === "P2002" && attempt < 2) continue;
        throw e;
      }
    }
    return NextResponse.json({ invoice });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
