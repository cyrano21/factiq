import { getCurrentUser } from "@/lib/auth";
import { buildXml, loadInvoiceForUser } from "@/lib/invoice-service";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non authentifié.", { status: 401 });
  const { id } = await params;
  const inv = await loadInvoiceForUser(id, user.id);
  if (!inv || inv.userId !== user.id) {
    return new Response("Facture introuvable.", { status: 404 });
  }

  const { xml, totalHT, totalVAT, totalTTC } = buildXml(inv);
  const mode = (inv.vatMode === "franchise" ? "franchise" : "standard") as
    | "franchise"
    | "standard";

  const pdf = await buildInvoicePdf({
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
      email: user.email,
    },
    buyer: {
      name: inv.client.name,
      address: inv.client.address,
      zip: inv.client.zip,
      city: inv.client.city,
      siret: inv.client.siret,
    },
    lines: inv.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })),
    totalHT,
    totalVAT,
    totalTTC,
    facturxXml: xml,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${inv.number}-facturx.pdf"`,
    },
  });
}
