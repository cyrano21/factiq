import { db } from "@/lib/db";
import {
  buildFacturXXml,
  computeTotals,
  type FacturXInput,
  type FacturXLine,
} from "@/lib/facturx";

export async function loadInvoiceForUser(invoiceId: string, userId: string) {
  return db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      client: true,
      user: true,
    },
  });
}

export function assertOwned<
  T extends { userId: string }
>(inv: T | null, userId: string): T {
  if (!inv || inv.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  return inv;
}

export function buildFacturXInput(inv: {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  vatRate: number;
  vatMode: string;
  paymentTerms: string;
  notes: string | null;
  user: {
    legalName: string | null;
    name: string;
    address: string | null;
    zip: string | null;
    city: string | null;
    siret: string | null;
    vatNumber: string | null;
  };
  client: {
    name: string;
    address: string | null;
    zip: string | null;
    city: string | null;
    siret: string | null;
    vatNumber: string | null;
  };
  lines: { description: string; quantity: number; unitPrice: number }[];
}): FacturXInput & { totals: ReturnType<typeof computeTotals> } {
  const mode = (inv.vatMode === "franchise" ? "franchise" : "standard") as
    | "franchise"
    | "standard";
  const fxLines: FacturXLine[] = inv.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
  }));
  const input: FacturXInput = {
    number: inv.number,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    currency: inv.currency,
    vatRate: inv.vatRate,
    vatMode: mode,
    paymentTerms: inv.paymentTerms,
    notes: inv.notes,
    seller: {
      name: inv.user.legalName || inv.user.name,
      address: inv.user.address,
      zip: inv.user.zip,
      city: inv.user.city,
      siret: inv.user.siret,
      vatNumber: inv.user.vatNumber,
    },
    buyer: {
      name: inv.client.name,
      address: inv.client.address,
      zip: inv.client.zip,
      city: inv.client.city,
      siret: inv.client.siret,
      vatNumber: inv.client.vatNumber,
    },
    lines: fxLines,
  };
  return { ...input, totals: computeTotals(fxLines, inv.vatRate, mode) };
}

export function buildXml(inv: NonNullable<Awaited<ReturnType<typeof loadInvoiceForUser>>>) {
  const input = buildFacturXInput(inv);
  return { xml: buildFacturXXml(input), ...input.totals };
}

/** Numérotation : FAC-YYYY-NNNN séquentielle par utilisateur et par année.
 * Adossée à un compteur persistant (table InvoiceCounter) incrémenté
 * atomiquement : le numéro ne décroît jamais, même après suppression d'un
 * brouillon, et les créations concurrentes reçoivent chacune un numéro
 * distinct. L'index unique @@unique([userId, number]) reste le garde-fou. */
export async function nextInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await db.invoiceCounter.upsert({
    where: { userId_year: { userId, year } },
    update: { lastNumber: { increment: 1 } },
    create: { userId, year, lastNumber: 1 },
  });
  return `FAC-${year}-${String(counter.lastNumber).padStart(4, "0")}`;
}

export const FREE_INVOICE_LIMIT = 5;
