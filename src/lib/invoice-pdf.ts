import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { centsToDecimalString, lineTotalCents } from "@/lib/money";
import {
  addPdfA3OutputIntent,
  applyPdfA3Metadata,
  attachFacturXEmbeddedFile,
  chargerPoliceDejaVu,
  chargerProfilIccSRgb,
  markUnstructured,
} from "./pdfa";

const DARK = rgb(0.09, 0.15, 0.12);
const GREEN = rgb(0.04, 0.55, 0.36);
const GREY = rgb(0.45, 0.48, 0.46);
const LIGHT = rgb(0.94, 0.96, 0.95);
const TEXT = rgb(0.13, 0.15, 0.14);

/**
 * Mentions obligatoires de facturation (code de commerce, art. L441-10 et
 * D441-5) — dessinées en 7 pt gris dans la zone mentions du PDF.
 * Exportées pour vérification (scripts de contrôle, tests).
 */
export const MENTIONS_OBLIGATOIRES: string[] = [
  "Escompte pour paiement anticipé : néant",
  "Pénalités de retard : intérêts au taux légal en vigueur. Indemnité forfaitaire pour frais de recouvrement : 40 € (art. L441-10 et D441-5 du code de commerce).",
];

/** Découpe un texte en lignes qui tiennent dans maxW points. */
function wrapText(s: string, f: PDFFont, size: number, maxW: number): string[] {
  const mots = s.split(/\s+/).filter(Boolean);
  const lignes: string[] = [];
  let courante = "";
  for (const mot of mots) {
    const candidate = courante ? `${courante} ${mot}` : mot;
    if (courante && f.widthOfTextAtSize(candidate, size) > maxW) {
      lignes.push(courante);
      courante = mot;
    } else {
      courante = candidate;
    }
  }
  if (courante) lignes.push(courante);
  return lignes;
}

export async function buildInvoicePdf(params: {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  vatRateCentiemes: number; // taux × 100 : 20 % → 2000
  vatMode: "standard" | "franchise";
  paymentTerms: string;
  notes?: string | null;
  seller: { name: string; address?: string | null; zip?: string | null; city?: string | null; siret?: string | null; email?: string | null };
  buyer: { name: string; address?: string | null; zip?: string | null; city?: string | null; siret?: string | null };
  lines: { description: string; quantity: number; unitPriceCents: number }[];
  totalHTCents: number;
  totalVATCents: number;
  totalTCCCents: number;
  facturxXml: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // PDF/A-3B : les polices base-14 (Helvetica…) sont interdites — on embarque
  // DejaVu Sans (licence Bitstream Vera libre) via @pdf-lib/fontkit.
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(chargerPoliceDejaVu(false), { subset: true });
  const bold = await doc.embedFont(chargerPoliceDejaVu(true), { subset: true });

  const page = doc.addPage([595.28, 841.89]); // A4

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
    const lineHTCents = lineTotalCents(l.quantity, l.unitPriceCents);
    text(l.description.slice(0, 58), M + 10, y, 9.5);
    text(String(l.quantity), 345, y, 9.5);
    const pu = `${centsToDecimalString(l.unitPriceCents)} ${params.currency}`;
    text(pu, 400, y, 9.5);
    const tt = `${centsToDecimalString(lineHTCents)} ${params.currency}`;
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
  const ht = `${centsToDecimalString(params.totalHTCents)} ${params.currency}`;
  text(ht, W - M - 12 - font.widthOfTextAtSize(ht, 9.5), y, 9.5, bold);
  text(
    params.vatMode === "franchise"
      ? "TVA (art. 293 B)"
      : `TVA (${(params.vatRateCentiemes / 100).toLocaleString("fr-FR")} %)`,
    bx + 12,
    y - 15,
    9.5,
    font,
    GREY
  );
  const vatLabel = `${centsToDecimalString(params.totalVATCents)} ${params.currency}`;
  text(vatLabel, W - M - 12 - font.widthOfTextAtSize(vatLabel, 9.5), y - 15, 9.5, bold);
  page.drawRectangle({ x: bx, y: y - 44, width: bw, height: 22, color: DARK });
  text("TOTAL TTC", bx + 12, y - 38, 10, bold, rgb(1, 1, 1));
  const ttc = `${centsToDecimalString(params.totalTCCCents)} ${params.currency}`;
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

  // Mentions obligatoires (escompte / pénalités de retard) — 7 pt, gris,
  // sous les mentions existantes, avec retour à la ligne automatique.
  y -= 30;
  for (const phrase of MENTIONS_OBLIGATOIRES) {
    const lignes = wrapText(phrase, font, 7, W - 2 * M);
    for (const ligne of lignes) {
      text(ligne, M, y, 7, font, GREY);
      y -= 10;
    }
    y -= 2; // respiration entre les phrases
  }

  // Pied de page
  page.drawRectangle({ x: 0, y: 0, width: W, height: 36, color: DARK });
  text(`Factiq - ${params.number} - ${params.seller.name}`, M, 14, 7.5, font, rgb(0.75, 0.85, 0.8));

  // XML Factur-X embarqué en pièce jointe conforme PDF/A-3 (EmbeddedFile +
  // Filespec /AFRelationship /Data + name tree + /AF catalogue).
  const horodatage = new Date();
  attachFacturXEmbeddedFile(doc, {
    xml: params.facturxXml,
    creationDate: horodatage,
    modificationDate: horodatage,
    description: "Factur-X EN 16931",
  });

  // Le dictionnaire Info doit rester cohérent avec le XMP (dc:title,
  // xmp:CreatorTool, pdf:Producer).
  doc.setTitle(`Facture ${params.number}`);
  doc.setProducer("Factiq");
  doc.setCreator("Factiq");

  // PDF/A-3B : XMP (pdfaid part=3 conformance=B + bloc fx:), OutputIntent
  // ICC sRGB (GTS_PDFA1), MarkInfo /Marked false. Aucun JavaScript, aucun
  // chiffrement : le document produit par pdf-lib est en clair par défaut.
  applyPdfA3Metadata(doc, {
    number: params.number,
    creator: "Factiq",
    producer: "Factiq",
    creationDate: horodatage,
    modificationDate: horodatage,
  });
  addPdfA3OutputIntent(doc, chargerProfilIccSRgb());
  markUnstructured(doc);

  // Enregistrement sans object streams (PDF/A : objets en clair, xref
  // classique) — nécessaire à l'interopérabilité Factur-X/PDP et aux
  // vérifications structurelles du document.
  return doc.save({ useObjectStreams: false });
}
