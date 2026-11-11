import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const DARK = rgb(0.09, 0.15, 0.12);
const GREEN = rgb(0.04, 0.55, 0.36);
const GREY = rgb(0.45, 0.48, 0.46);
const LIGHT = rgb(0.94, 0.96, 0.95);
const TEXT = rgb(0.13, 0.15, 0.14);

export async function buildInvoicePdf(params: {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  vatRate: number;
  vatMode: "standard" | "franchise";
  paymentTerms: string;
  notes?: string | null;
  seller: { name: string; address?: string | null; zip?: string | null; city?: string | null; siret?: string | null; email?: string | null };
  buyer: { name: string; address?: string | null; zip?: string | null; city?: string | null; siret?: string | null };
  lines: { description: string; quantity: number; unitPrice: number }[];
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  facturxXml: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const M = 48;
  let y = 800;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 10,
    f = font,
    color = TEXT
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  // Bandeau supérieur
  page.drawRectangle({ x: 0, y: 785, width: W, height: 56, color: DARK });
  text("FACTIQ", M, 805, 20, bold, rgb(1, 1, 1));
  const brand = "Facturation électronique conforme - réforme 2026-2027";
  text(brand, M, 793, 7.5, font, rgb(0.75, 0.85, 0.8));
  text("FACTURE", W - M - bold.widthOfTextAtSize("FACTURE", 18), 803, 18, bold, rgb(1, 1, 1));

  y = 755;
  // Numéro + dates
  text(`Numéro de facture`, M, y, 8, font, GREY);
  text(params.number, M, y - 14, 12, bold, DARK);
  text(`Date d'émission`, 260, y, 8, font, GREY);
  text(params.issueDate, 260, y - 14, 11, bold);
  text(`Date d'échéance`, 420, y, 8, font, GREY);
  text(params.dueDate, 420, y - 14, 11, bold);

  // Émetteur / client
  y -= 52;
  page.drawRectangle({ x: M, y: y - 78, width: (W - 2 * M - 12) / 2, height: 84, color: LIGHT });
  page.drawRectangle({ x: M + (W - 2 * M - 12) / 2 + 12, y: y - 78, width: (W - 2 * M - 12) / 2, height: 84, color: LIGHT });
  text("ÉMETTEUR", M + 10, y + 0, 7.5, bold, GREEN);
  text("CLIENT", M + (W - 2 * M - 12) / 2 + 22, y + 0, 7.5, bold, GREEN);

  const block = (
    lines: string[],
    x: number
  ) => {
    let yy = y - 13;
    for (const l of lines) {
      text(l.slice(0, 52), x, yy, 9, font, TEXT);
      yy -= 12;
    }
  };
  const sellerLines = [
    params.seller.name,
    params.seller.address ?? "",
    [params.seller.zip, params.seller.city].filter(Boolean).join(" "),
    params.seller.siret ? `SIRET : ${params.seller.siret}` : "",
    params.vatMode === "franchise" ? "TVA non applicable, art. 293 B du CGI" : "",
  ].filter(Boolean);
  const buyerLines = [
    params.buyer.name,
    params.buyer.address ?? "",
    [params.buyer.zip, params.buyer.city].filter(Boolean).join(" "),
    params.buyer.siret ? `SIRET : ${params.buyer.siret}` : "",
  ].filter(Boolean);
  block(sellerLines, M + 10);
  block(buyerLines, M + (W - 2 * M - 12) / 2 + 22);

  // Tableau des lignes
  y -= 106;
  page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 20, color: DARK });
  text("DÉSIGNATION", M + 10, y + 1, 8, bold, rgb(1, 1, 1));
  text("QTÉ", 340, y + 1, 8, bold, rgb(1, 1, 1));
  text("P.U. HT", 400, y + 1, 8, bold, rgb(1, 1, 1));
  text("TOTAL HT", W - M - 10 - bold.widthOfTextAtSize("TOTAL HT", 8), y + 1, 8, bold, rgb(1, 1, 1));

  y -= 26;
  for (const l of params.lines) {
    const lineHT = l.quantity * l.unitPrice;
    text(l.description.slice(0, 58), M + 10, y, 9.5);
    text(String(l.quantity), 345, y, 9.5);
    text(`${l.unitPrice.toFixed(2)} ${params.currency}`, 400, y, 9.5);
    const tt = `${lineHT.toFixed(2)} ${params.currency}`;
    text(tt, W - M - 10 - font.widthOfTextAtSize(tt, 9.5), y, 9.5);
    y -= 12;
    page.drawLine({
      start: { x: M, y: y + 4 },
      end: { x: W - M, y: y + 4 },
      thickness: 0.5,
      color: rgb(0.88, 0.9, 0.89),
    });
    y -= 8;
  }

  // Totaux
  y -= 6;
  const bx = 360;
  const bw = W - M - bx;
  page.drawRectangle({ x: bx, y: y - 58, width: bw, height: 76, color: LIGHT });
  text("Total HT", bx + 12, y, 9.5, font, GREY);
  text(`${params.totalHT.toFixed(2)} ${params.currency}`, W - M - 12 - font.widthOfTextAtSize(`${params.totalHT.toFixed(2)} ${params.currency}`, 9.5), y, 9.5, bold);
  text(
    params.vatMode === "franchise" ? "TVA (art. 293 B)" : `TVA (${params.vatRate} %)`,
    bx + 12,
    y - 15,
    9.5,
    font,
    GREY
  );
  const vatLabel = `${params.totalVAT.toFixed(2)} ${params.currency}`;
  text(vatLabel, W - M - 12 - font.widthOfTextAtSize(vatLabel, 9.5), y - 15, 9.5, bold);
  page.drawRectangle({ x: bx, y: y - 44, width: bw, height: 22, color: DARK });
  text("TOTAL TTC", bx + 12, y - 38, 10, bold, rgb(1, 1, 1));
  const ttc = `${params.totalTTC.toFixed(2)} ${params.currency}`;
  text(ttc, W - M - 12 - bold.widthOfTextAtSize(ttc, 10.5), y - 38, 10.5, bold, rgb(1, 1, 1));

  // Mentions légales + paiement
  y -= 92;
  text("Conditions de paiement", M, y, 8, bold, GREEN);
  text(params.paymentTerms, M, y - 13, 9, font, TEXT);
  if (params.seller.email) {
    text(`Contact : ${params.seller.email}`, M, y - 26, 9, font, TEXT);
  }
  y -= 48;
  text(
    "Facture électronique : XML Factur-X (CII EN 16931) embarqué dans ce PDF - prêt pour transmission PDP.",
    M,
    y,
    7.5,
    font,
    GREY
  );
  text(
    "Réforme de facturation électronique : réception obligatoire depuis le 01/09/2026, émission TPE/PME au 01/09/2027.",
    M,
    y - 12,
    7.5,
    font,
    GREY
  );

  // Pied de page
  page.drawRectangle({ x: 0, y: 0, width: W, height: 36, color: DARK });
  text(`Factiq - ${params.number} - ${params.seller.name}`, M, 14, 7.5, font, rgb(0.75, 0.85, 0.8));

  // XML Factur-X embarqué (cœur du format Factur-X)
  const xmlBytes = new TextEncoder().encode(params.facturxXml);
  await doc.attach(xmlBytes, "factur-x.xml", {
    mimeType: "text/xml",
    description: "Factur-X EN 16931",
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  doc.setTitle(`Facture ${params.number}`);
  doc.setProducer("Factiq");
  doc.setCreator("Factiq");

  return doc.save();
}
