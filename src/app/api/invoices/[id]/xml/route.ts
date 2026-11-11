import { getCurrentUser } from "@/lib/auth";
import { buildXml, loadInvoiceForUser } from "@/lib/invoice-service";

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
  const { xml } = buildXml(inv);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${inv.number}-factur-x.xml"`,
    },
  });
}
