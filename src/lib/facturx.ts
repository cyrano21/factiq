/**
 * Générateur de XML Factur-X (profil EN 16931, syntaxe CII D16B).
 * La facture électronique française obligatoire (réforme 2026-2027) doit
 * être échangée en UBL, CII ou Factur-X via une plateforme agréée (PDP).
 * Factur-X = PDF/A-3 avec XML CII embarqué — ce module produit le XML.
 *
 * Monnaie : tous les montants circulent en CENTIMES ENTIERS (Int) et sont
 * convertis en décimales à 2 chiffres uniquement au moment de la sérialisation
 * XML, par arithmétique entière (src/lib/money.ts).
 */
import { centsToDecimalString, computeTotalsCents, type TotalsCents } from "@/lib/money";

export type FacturXLine = {
  description: string;
  quantity: number; // grandeur non monétaire (heures fractionnaires admises)
  unitPriceCents: number; // centimes d'euro
};

export type FacturXParty = {
  name: string;
  address?: string | null;
  zip?: string | null;
  city?: string | null;
  siret?: string | null; // SIREN (9 chiffres) de préférence dans le XML
  vatNumber?: string | null;
};

export type FacturXInput = {
  number: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string;
  vatRateCentiemes: number; // taux × 100 : 20 % → 2000, 5,5 % → 550
  vatMode: "standard" | "franchise";
  paymentTerms: string;
  notes?: string | null;
  seller: FacturXParty;
  buyer: FacturXParty;
  lines: FacturXLine[];
};

export type FacturXTotals = TotalsCents;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sirenFromSiret(siret: string | null | undefined): string | null {
  if (!siret) return null;
  const digits = siret.replace(/\s+/g, "");
  if (digits.length >= 9) return digits.slice(0, 9);
  return digits.length > 0 ? digits : null;
}

/** Date YYYY-MM-DD → 102 (YYYYMMDD) */
function d102(date: string): string {
  return date.replaceAll("-", "");
}

/** Quantité (non monétaire) sérialisée à 2 décimales : 1,5 → "1.50". */
function qty(n: number): string {
  return n.toFixed(2);
}

export function buildFacturXXml(input: FacturXInput): string {
  // Règles EN 16931 (implémentées dans computeTotalsCents, src/lib/money.ts) :
  // BR-CO-10 — Σ (LineTotalAmount) = TaxBasisTotalAmount : chaque ligne est
  // arrondie au centime PUIS sommée (arithmétique entière exacte).
  // BR-CO-17 — CalculatedAmount = BasisAmount × taux, arrondi au centime.
  const totals = computeTotalsCents(
    input.lines,
    input.vatRateCentiemes,
    input.vatMode
  );
  const catCode = input.vatMode === "franchise" ? "E" : "S";
  const ratePercent = centsToDecimalString(input.vatMode === "franchise" ? 0 : input.vatRateCentiemes);
  const sellerSiren = sirenFromSiret(input.seller.siret);
  const buyerSiren = sirenFromSiret(input.buyer.siret);

  const party = (p: FacturXParty, siren: string | null) => `
        <ram:Name>${esc(p.name)}</ram:Name>
        ${
          siren
            ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(siren)}</ram:ID></ram:SpecifiedLegalOrganization>`
            : ""
        }
        ${
          p.address || p.zip || p.city
            ? `<ram:PostalTradeAddress><ram:PostcodeCode>${esc(p.zip ?? "")}</ram:PostcodeCode><ram:LineOne>${esc(p.address ?? "")}</ram:LineOne><ram:CityName>${esc(p.city ?? "")}</ram:CityName><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>`
            : `<ram:PostalTradeAddress><ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>`
        }
        ${
          p.vatNumber
            ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(p.vatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>`
            : ""
        }`;

  const lineItems = input.lines
    .map((l, i) => {
      const lineHTCents = Math.round(l.quantity * l.unitPriceCents);
      return `
      <ram:IncludedSupplyChainTradeLineItem>
        <ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
        <ram:SpecifiedTradeProduct><ram:Name>${esc(l.description)}</ram:Name></ram:SpecifiedTradeProduct>
        <ram:SpecifiedLineTradeAgreement>
          <ram:NetPriceProductTradePrice><ram:ChargeAmount>${centsToDecimalString(l.unitPriceCents)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
        </ram:SpecifiedLineTradeAgreement>
        <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">${qty(l.quantity)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
        <ram:SpecifiedLineTradeSettlement>
          <ram:ApplicableTradeTax>
            <ram:TypeCode>VAT</ram:TypeCode>
            <ram:CategoryCode>${catCode}</ram:CategoryCode>
            <ram:RateApplicablePercent>${ratePercent}</ram:RateApplicablePercent>
          </ram:ApplicableTradeTax>
          <ram:SpecifiedTradeSettlementLineMonetarySummation>
            <ram:LineTotalAmount>${centsToDecimalString(lineHTCents)}</ram:LineTotalAmount>
          </ram:SpecifiedTradeSettlementLineMonetarySummation>
        </ram:SpecifiedLineTradeSettlement>
      </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>A1</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:factur-x.eu:1p0:facturx-en16931</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(input.number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${d102(input.issueDate)}</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lineItems}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>${party(input.seller, sellerSiren)}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>${party(input.buyer, buyerSiren)}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${d102(input.issueDate)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:CreditorReferenceTypeCode>58</ram:CreditorReferenceTypeCode>
      <ram:InvoiceCurrencyCode>${esc(input.currency)}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>30</ram:TypeCode></ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${centsToDecimalString(totals.totalVATCents)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>${input.vatMode === "franchise" ? "TVA non applicable, art. 293 B du CGI" : ""}</ram:ExemptionReason>
        <ram:BasisAmount>${centsToDecimalString(totals.totalHTCents)}</ram:BasisAmount>
        <ram:CategoryCode>${catCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${ratePercent}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">${d102(input.dueDate)}</udt:DateTimeString></ram:DueDateDateTime><ram:Description>${esc(input.paymentTerms)}</ram:Description></ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${centsToDecimalString(totals.totalHTCents)}</ram:LineTotalAmount>
        <ram:ChargeTotalAmount>0.00</ram:ChargeTotalAmount>
        <ram:AllowanceTotalAmount>0.00</ram:AllowanceTotalAmount>
        <ram:TaxBasisTotalAmount>${centsToDecimalString(totals.totalHTCents)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${esc(input.currency)}">${centsToDecimalString(totals.totalVATCents)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${centsToDecimalString(totals.totalTCCCents)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>0.00</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${centsToDecimalString(totals.totalTCCCents)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/* ------------------------------------------------------------------ */
/* Validation structurelle EN 16931 (contrôles par extraction regex)  */
/* ------------------------------------------------------------------ */

export type FacturXValidationResult = {
  ok: boolean;
  errors: string[];
};

/** Tolérance de comparaison des montants (« à 0,01 près »). */
const TOLERANCE_MONTANTS = 0.01;
const EPSILON = 1e-9;

function parseMontant(v: string): number | null {
  const t = v.trim().replace(/\s+/g, "").replace(/,/g, ".");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function fmtMontant(n: number): string {
  return n.toFixed(2);
}

/**
 * Valide la structure du XML CII EN 16931 sans dépendance XML :
 *  - GUIDeline `urn:factur-x.eu:1p0:facturx-en16931` ;
 *  - TypeCode 380 (facture commerciale) dans l'ExchangedDocument ;
 *  - IssueDateTime présent (format 102 AAAAMMJJ) ;
 *  - montants obligatoires du bloc d'en-tête (Line/TaxBasis/TaxTotal/
 *    Grand/DuePayable) présents et numériques ;
 *  - BR-CO-10 : Σ des LineTotalAmount des lignes = TaxBasisTotalAmount
 *    (à 0,01 près) ;
 *  - BR-CO-11 : GrandTotalAmount = TaxBasisTotalAmount + TaxTotalAmount ;
 *  - BR-CO-12 : DuePayableAmount = GrandTotalAmount.
 * Ne modifie jamais le XML : retourne ok=false + erreurs en français.
 */
export function validateFacturXXml(xml: string): FacturXValidationResult {
  const errors: string[] = [];

  // 1) GUIDeline Factur-X EN 16931 (identifiant de la guideline CII).
  const guideline = /<ram:GuidelineSpecifiedDocumentContextParameter>\s*<ram:ID>\s*([^<]+?)\s*<\/ram:ID>/.exec(
    xml
  );
  if (!guideline) {
    errors.push(
      "GUIDeline absente : <ram:GuidelineSpecifiedDocumentContextParameter>/<ram:ID> introuvable."
    );
  } else if (guideline[1] !== "urn:factur-x.eu:1p0:facturx-en16931") {
    errors.push(
      `GUIDeline non conforme : « ${guideline[1]} » ≠ « urn:factur-x.eu:1p0:facturx-en16931 » (profil EN 16931 attendu).`
    );
  }

  // 2) TypeCode du document (= 380, facture commerciale).
  const blocDocument = /<rsm:ExchangedDocument>[\s\S]*?<\/rsm:ExchangedDocument>/.exec(xml);
  if (!blocDocument) {
    errors.push("Bloc <rsm:ExchangedDocument> absent.");
  } else {
    const typeCode = /<ram:TypeCode>\s*([^<]+?)\s*<\/ram:TypeCode>/.exec(blocDocument[0]);
    if (!typeCode) {
      errors.push("TypeCode du document absent dans <rsm:ExchangedDocument> (attendu 380).");
    } else if (typeCode[1] !== "380") {
      errors.push(
        `TypeCode du document invalide : « ${typeCode[1]} » (attendu 380 = facture commerciale).`
      );
    }
  }

  // 3) IssueDateTime présent et bien formé (format 102 = AAAAMMJJ).
  if (
    !/<ram:IssueDateTime>\s*<udt:DateTimeString[^>]*>\s*\d{8}\s*<\/udt:DateTimeString>\s*<\/ram:IssueDateTime>/.test(
      xml
    )
  ) {
    errors.push(
      'IssueDateTime absent ou mal formé (attendu <udt:DateTimeString format="102">AAAAMMJJ</udt:DateTimeString>).'
    );
  }

  // 4) Montants obligatoires du bloc de sommes d'en-tête.
  const blocSommes =
    /<ram:SpecifiedTradeSettlementHeaderMonetarySummation>[\s\S]*?<\/ram:SpecifiedTradeSettlementHeaderMonetarySummation>/.exec(
      xml
    );
  if (!blocSommes) {
    errors.push("Bloc <ram:SpecifiedTradeSettlementHeaderMonetarySummation> absent.");
    return { ok: false, errors };
  }
  const montant = (balise: string): number | null => {
    // [^>]* : tolère les attributs (ex. <ram:TaxTotalAmount currencyID="EUR">).
    const m = new RegExp(`<ram:${balise}[^>]*>\\s*([^<]+?)\\s*</ram:${balise}>`).exec(
      blocSommes[0]
    );
    return m ? parseMontant(m[1]) : null;
  };
  const lineTotal = montant("LineTotalAmount");
  const taxBasis = montant("TaxBasisTotalAmount");
  const taxTotal = montant("TaxTotalAmount");
  const grandTotal = montant("GrandTotalAmount");
  const duePayable = montant("DuePayableAmount");
  const montants: [string, number | null][] = [
    ["LineTotalAmount", lineTotal],
    ["TaxBasisTotalAmount", taxBasis],
    ["TaxTotalAmount", taxTotal],
    ["GrandTotalAmount", grandTotal],
    ["DuePayableAmount", duePayable],
  ];
  for (const [nom, valeur] of montants) {
    if (valeur === null) {
      errors.push(`Montant obligatoire absent ou non numérique : ${nom}.`);
    }
  }

  // 5) Somme des LineTotalAmount des lignes (BR-CO-10).
  const blocsLignes =
    xml.match(/<ram:IncludedSupplyChainTradeLineItem>[\s\S]*?<\/ram:IncludedSupplyChainTradeLineItem>/g) ?? [];
  if (blocsLignes.length === 0) {
    errors.push(
      "Aucune ligne de facture (<ram:IncludedSupplyChainTradeLineItem>) — une facture EN 16931 doit contenir au moins une ligne (BR-16)."
    );
  }
  let sommeLignes = 0;
  let lignesNumeriques = true;
  blocsLignes.forEach((bloc, i) => {
    const m = /<ram:LineTotalAmount[^>]*>\s*([^<]+?)\s*<\/ram:LineTotalAmount>/.exec(bloc);
    const v = m ? parseMontant(m[1]) : null;
    if (v === null) {
      errors.push(`LineTotalAmount absent ou non numérique pour la ligne ${i + 1}.`);
      lignesNumeriques = false;
    } else {
      sommeLignes += v;
    }
  });

  // 6) Règles de cohérence des totaux (uniquement si tout est numérique).
  if (
    lineTotal !== null &&
    taxBasis !== null &&
    taxTotal !== null &&
    grandTotal !== null &&
    duePayable !== null &&
    lignesNumeriques
  ) {
    if (Math.abs(sommeLignes - taxBasis) > TOLERANCE_MONTANTS + EPSILON) {
      errors.push(
        `BR-CO-10 : Σ des LineTotalAmount des lignes (${fmtMontant(sommeLignes)}) ≠ TaxBasisTotalAmount (${fmtMontant(taxBasis)}).`
      );
    }
    if (Math.abs(grandTotal - (taxBasis + taxTotal)) > TOLERANCE_MONTANTS + EPSILON) {
      errors.push(
        `BR-CO-11 : GrandTotalAmount (${fmtMontant(grandTotal)}) ≠ TaxBasisTotalAmount + TaxTotalAmount (${fmtMontant(taxBasis + taxTotal)}).`
      );
    }
    if (Math.abs(duePayable - grandTotal) > TOLERANCE_MONTANTS + EPSILON) {
      errors.push(
        `BR-CO-12 : DuePayableAmount (${fmtMontant(duePayable)}) ≠ GrandTotalAmount (${fmtMontant(grandTotal)}).`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
