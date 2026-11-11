/**
 * Générateur de XML Factur-X (profil EN 16931, syntaxe CII D16B).
 * La facture électronique française obligatoire (réforme 2026-2027) doit
 * être échangée en UBL, CII ou Factur-X via une plateforme agréée (PDP).
 * Factur-X = PDF/A-3 avec XML CII embarqué — ce module produit le XML.
 */

export type FacturXLine = {
  description: string;
  quantity: number;
  unitPrice: number;
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
  vatRate: number;
  vatMode: "standard" | "franchise";
  paymentTerms: string;
  notes?: string | null;
  seller: FacturXParty;
  buyer: FacturXParty;
  lines: FacturXLine[];
};

export type FacturXTotals = {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n: number): string {
  return n.toFixed(2);
}

/** Date YYYY-MM-DD → 102 (YYYYMMDD) */
function d102(date: string): string {
  return date.replaceAll("-", "");
}

function sirenFromSiret(siret: string | null | undefined): string | null {
  if (!siret) return null;
  const digits = siret.replace(/\s+/g, "");
  if (digits.length >= 9) return digits.slice(0, 9);
  return digits.length > 0 ? digits : null;
}

export function computeTotals(
  lines: FacturXLine[],
  vatRate: number,
  vatMode: "standard" | "franchise"
): FacturXTotals {
  const totalHT = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const totalVAT = vatMode === "franchise" ? 0 : totalHT * (vatRate / 100);
  return {
    totalHT: round2(totalHT),
    totalVAT: round2(totalVAT),
    totalTTC: round2(totalHT + totalVAT),
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildFacturXXml(input: FacturXInput): string {
  const totals = computeTotals(input.lines, input.vatRate, input.vatMode);
  const catCode = input.vatMode === "franchise" ? "E" : "S";
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
      const lineHT = round2(l.quantity * l.unitPrice);
      return `
      <ram:IncludedSupplyChainTradeLineItem>
        <ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
        <ram:SpecifiedTradeProduct><ram:Name>${esc(l.description)}</ram:Name></ram:SpecifiedTradeProduct>
        <ram:SpecifiedLineTradeAgreement>
          <ram:NetPriceProductTradePrice><ram:ChargeAmount>${fmt(l.unitPrice)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
        </ram:SpecifiedLineTradeAgreement>
        <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">${fmt(l.quantity)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
        <ram:SpecifiedLineTradeSettlement>
          <ram:ApplicableTradeTax>
            <ram:TypeCode>VAT</ram:TypeCode>
            <ram:CategoryCode>${catCode}</ram:CategoryCode>
            <ram:RateApplicablePercent>${fmt(input.vatMode === "franchise" ? 0 : input.vatRate)}</ram:RateApplicablePercent>
          </ram:ApplicableTradeTax>
          <ram:SpecifiedTradeSettlementLineMonetarySummation>
            <ram:LineTotalAmount>${fmt(lineHT)}</ram:LineTotalAmount>
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
        <ram:CalculatedAmount>${fmt(totals.totalVAT)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>${input.vatMode === "franchise" ? "TVA non applicable, art. 293 B du CGI" : ""}</ram:ExemptionReason>
        <ram:BasisAmount>${fmt(totals.totalHT)}</ram:BasisAmount>
        <ram:CategoryCode>${catCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${fmt(input.vatMode === "franchise" ? 0 : input.vatRate)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">${d102(input.dueDate)}</udt:DateTimeString></ram:DueDateDateTime><ram:Description>${esc(input.paymentTerms)}</ram:Description></ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${fmt(totals.totalHT)}</ram:LineTotalAmount>
        <ram:ChargeTotalAmount>0.00</ram:ChargeTotalAmount>
        <ram:AllowanceTotalAmount>0.00</ram:AllowanceTotalAmount>
        <ram:TaxBasisTotalAmount>${fmt(totals.totalHT)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${esc(input.currency)}">${fmt(totals.totalVAT)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${fmt(totals.totalTTC)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>0.00</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${fmt(totals.totalTTC)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}
