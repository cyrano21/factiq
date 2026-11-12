/**
 * pdfa.ts — primitives bas niveau pdf-lib pour produire des PDF/A-3B
 * compatibles Factur-X (cœur du format : PDF/A-3 + XML CII embarqué).
 *
 * Tout se fait via l'API bas niveau de pdf-lib (PDFRawStream, PDFDict,
 * PDFName, PDFArray, PDFString, PDFHexString, context.register) : aucune
 * dépendance nouvelle, aucun chemin absolu en dur (les binaires vendus
 * sont résolus relativement à ce module ou au répertoire de travail).
 *
 * Éléments posés sur le document :
 *  - /Metadata : XMP complet NON compressé (pdfaid part=3 conformance=B,
 *    bloc Factur-X fx: + extension pdfaExtension) ;
 *  - pièce jointe factur-x.xml : EmbeddedFile (FlateDecode, Subtype
 *    text/xml, Params Size + dates), Filespec (/F, /UF, /Desc,
 *    /AFRelationship /Data), name tree /Names /EmbeddedFiles et
 *    tableau /AF au catalogue ;
 *  - /OutputIntents : /S /GTS_PDFA1, OutputConditionIdentifier « sRGB »,
 *    /DestOutputProfile → profil ICC embarqué (/N 3) ;
 *  - /MarkInfo << /Marked false >> (niveau B : sans tagging).
 */

import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFString,
} from "pdf-lib";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Nom canonique du fichier XML embarqué (imposé par le format Factur-X). */
export const FICHIER_FACTURX = "factur-x.xml";

/** Espaces de nommage XMP du bloc Factur-X (standard Factur-X 1.0 / FNFE). */
const NS_FX = "urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#";
const NS_PDFAID = "http://www.aiim.org/pdfa/ns/id/";
const NS_PDFA_EXT = "http://www.aiim.org/pdfa/ns/extension/";
const NS_PDFA_SCHEMA = "http://www.aiim.org/pdfa/ns/schema#";
const NS_PDFA_PROPERTY = "http://www.aiim.org/pdfa/ns/property#";

/* ------------------------------------------------------------------ */
/* Chargement des binaires vendus (polices, profil ICC)               */
/* ------------------------------------------------------------------ */

const CACHE_ASSETS = new Map<string, Uint8Array>();

/**
 * Lit un binaire vendu (polices, profil ICC) depuis des emplacements
 * disque DÉTERMINISTES : `src/assets/` (dépôt, dev) puis `public/assets/`
 * (déploiement, copie miroir).
 *
 * On n'utilise PAS `new URL(..., import.meta.url)` : Turbopack transforme ce
 * motif en « asset wildcard » et son mapping a renvoyé le MAUVAIS fichier
 * (une police à la place du profil ICC) dans le bundle serveur — d'où des
 * OutputIntents invalides. La résolution fs est sans ambiguïté.
 */
function chargerAsset(relatif: string): Uint8Array {
  const enCache = CACHE_ASSETS.get(relatif);
  if (enCache) return enCache;

  const candidats = [
    join(process.cwd(), "src", "assets", relatif),
    join(process.cwd(), "public", "assets", relatif),
  ];

  for (const chemin of candidats) {
    try {
      const octets = new Uint8Array(readFileSync(chemin));
      CACHE_ASSETS.set(relatif, octets);
      return octets;
    } catch {
      // Candidat suivant.
    }
  }
  throw new Error(
    `Ressource PDF/A introuvable : ${relatif} (chemins testés : ${candidats.join(" ; ")})`
  );
}

/** Police DejaVu Sans embarquée (TTF) — gras = DejaVuSans-Bold.ttf. */
export function chargerPoliceDejaVu(gras = false): Uint8Array {
  return chargerAsset(gras ? "fonts/DejaVuSans-Bold.ttf" : "fonts/DejaVuSans.ttf");
}

/** Profil ICC sRGB vendu (DestOutputProfile de l'OutputIntent PDF/A-3). */
export function chargerProfilIccSRgb(): Uint8Array {
  return chargerAsset("icc/srgb.icc");
}

/* ------------------------------------------------------------------ */
/* XMP Factur-X                                                       */
/* ------------------------------------------------------------------ */

/** Échappement XML minimal (le numéro de facture peut contenir & ou <). */
function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Date XMP (ISO 8601, ex. 2025-11-12T10:30:00Z). */
function dateXmp(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export type FacturXXmpParams = {
  /** Numéro de facture (dc:title = « Facture <numéro> »). */
  number: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
};

/**
 * Construit le XMP complet d'une facture Factur-X (PDF/A-3B, profil EN 16931).
 * Reproduit la structure des exemples officiels ZUGFeRD 2.x / Factur-X 1.0 :
 * dc + xmp + pdf + pdfaid (part/conformance) + fx (DocumentType,
 * DocumentFileName, Version, ConformanceLevel) + pdfaExtension décrivant
 * l'espace fx (schema/property/valueType), requis par la validation PDF/A-3.
 */
export function buildFacturXXmp(params: FacturXXmpParams): string {
  const titre = `Facture ${params.number}`;
  const createur = params.creator ?? "Factiq";
  const producteur = params.producer ?? "Factiq";
  const creation = dateXmp(params.creationDate ?? new Date());
  const modification = dateXmp(params.modificationDate ?? params.creationDate ?? new Date());

  const proprietesFx = (
    [
      ["DocumentType", "INVOICE"],
      ["DocumentFileName", "name of the embedded XML invoice file"],
      ["Version", "The actual version of the Factur-X XML schema"],
      ["ConformanceLevel", "The conformance level of the embedded Factur-X data"],
    ] as const
  )
    .map(
      ([nom, description]) => `        <rdf:li rdf:parseType="Resource">
         <pdfaProperty:name>${nom}</pdfaProperty:name>
         <pdfaProperty:valueType>Text</pdfaProperty:valueType>
         <pdfaProperty:category>external</pdfaProperty:category>
         <pdfaProperty:description>${description}</pdfaProperty:description>
        </rdf:li>`
    )
    .join("\n");

  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escXml(titre)}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>${escXml(createur)}</rdf:li></rdf:Seq></dc:creator>
      <dc:description><rdf:Alt><rdf:li xml:lang="x-default">Facture électronique Factur-X (CII EN 16931) — PDF/A-3B</rdf:li></rdf:Alt></dc:description>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>${escXml(createur)}</xmp:CreatorTool>
      <xmp:CreateDate>${creation}</xmp:CreateDate>
      <xmp:ModifyDate>${modification}</xmp:ModifyDate>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>${escXml(producteur)}</pdf:Producer>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaid="${NS_PDFAID}">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="${NS_FX}">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>${FICHIER_FACTURX}</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaExtension="${NS_PDFA_EXT}" xmlns:pdfaSchema="${NS_PDFA_SCHEMA}" xmlns:pdfaProperty="${NS_PDFA_PROPERTY}">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>${NS_FX}</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaSchema:property>
              <rdf:Seq>
${proprietesFx}
              </rdf:Seq>
            </pdfaSchema:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Pose le XMP comme stream /Metadata du catalogue, NON compressé
 * (obligation PDF/A : le flux de métadonnées ne doit pas être filtré).
 */
export function applyPdfA3Metadata(doc: PDFDocument, params: FacturXXmpParams): void {
  const xmp = buildFacturXXmp(params);
  const octets = new TextEncoder().encode(xmp);
  const stream = PDFRawStream.of(
    doc.context.obj({ Type: "Metadata", Subtype: "XML" }),
    octets
  );
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(stream));
}

/* ------------------------------------------------------------------ */
/* Pièce jointe factur-x.xml (cœur du format Factur-X)                */
/* ------------------------------------------------------------------ */

export type FacturXAttachmentParams = {
  xml: string | Uint8Array;
  creationDate: Date;
  modificationDate: Date;
  description?: string;
};

/**
 * Embarque le XML CII comme pièce jointe associée conforme PDF/A-3 :
 *  - EmbeddedFile compressé (FlateDecode) avec /Subtype /text#2Fxml et
 *    /Params (Size, CreationDate, ModDate) ;
 *  - Filespec avec /F (PDFDocEncoded), /UF (UTF-16), /Desc et
 *    /AFRelationship /Data (relation imposée pour la facture Factur-X) ;
 *  - name tree /Names /EmbeddedFiles au catalogue (clé = factur-x.xml) ;
 *  - tableau /AF au catalogue référençant la Filespec.
 * Remplace doc.attach (champs AFRelationship / UF / AF manquants ou non
 * maîtrisés) par une construction entièrement bas niveau.
 */
export function attachFacturXEmbeddedFile(
  doc: PDFDocument,
  params: FacturXAttachmentParams
): void {
  const { context, catalog } = doc;
  const xmlBytes =
    typeof params.xml === "string" ? new TextEncoder().encode(params.xml) : params.xml;

  // 1) Stream EmbeddedFile du XML (compression FlateDecode, autorisée en
  //    PDF/A-3 pour les fichiers associés — seul /Metadata doit rester brut).
  const embeddedFileStream = context.flateStream(xmlBytes, {
    Type: "EmbeddedFile",
    Subtype: "text/xml",
    Params: {
      Size: xmlBytes.length,
      CreationDate: PDFString.fromDate(params.creationDate),
      ModDate: PDFString.fromDate(params.modificationDate),
    },
  });
  const streamRef = context.register(embeddedFileStream);

  // 2) Filespec de la pièce jointe.
  const filespec = context.obj({
    Type: "Filespec",
    F: PDFString.of(FICHIER_FACTURX),
    UF: PDFHexString.fromText(FICHIER_FACTURX),
    Desc: PDFHexString.fromText(params.description ?? "Factur-X EN 16931"),
    AFRelationship: "Data",
    EF: { F: streamRef },
  });
  const specRef = context.register(filespec);

  // 3) Name tree /Names /EmbeddedFiles (clé PDFString => litéral greppable).
  if (!catalog.has(PDFName.of("Names"))) {
    catalog.set(PDFName.of("Names"), context.obj({}));
  }
  const noms = catalog.lookup(PDFName.of("Names"), PDFDict);
  if (!noms.has(PDFName.of("EmbeddedFiles"))) {
    noms.set(PDFName.of("EmbeddedFiles"), context.obj({}));
  }
  const fichiersEmbarques = noms.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
  fichiersEmbarques.set(
    PDFName.of("Names"),
    context.obj([PDFString.of(FICHIER_FACTURX), specRef])
  );

  // 4) Tableau /AF du catalogue (Associated Files — exigé par PDF/A-3).
  if (!catalog.has(PDFName.of("AF"))) {
    catalog.set(PDFName.of("AF"), context.obj([]) as PDFArray);
  }
  const af = catalog.lookup(PDFName.of("AF"), PDFArray);
  af.push(specRef);

  // 5) Afficher la pièce jointe à l'ouverture (comme les générateurs
  //    Factur-X de référence, ex. la lib python facturx d'Akretion).
  catalog.set(PDFName.of("PageMode"), PDFName.of("UseAttachments"));
}

/* ------------------------------------------------------------------ */
/* OutputIntent ICC (obligatoire PDF/A)                               */
/* ------------------------------------------------------------------ */

/**
 * Ajoute /OutputIntents au catalogue : /S /GTS_PDFA1,
 * /OutputConditionIdentifier « sRGB », /DestOutputProfile → stream ICC /N 3.
 */
export function addPdfA3OutputIntent(
  doc: PDFDocument,
  iccBytes: Uint8Array,
  condition = "sRGB"
): void {
  const { context, catalog } = doc;
  const iccStream = PDFRawStream.of(context.obj({ N: 3 }), iccBytes);
  const iccRef = context.register(iccStream);

  const intent = context.obj({
    Type: "OutputIntent",
    S: "GTS_PDFA1",
    OutputConditionIdentifier: PDFString.of(condition),
    Info: PDFString.of(condition),
    RegistryName: PDFString.of("http://www.color.org"),
    DestOutputProfile: iccRef,
  });
  catalog.set(PDFName.of("OutputIntents"), context.obj([intent]) as PDFArray);
}

/* ------------------------------------------------------------------ */
/* Divers                                                             */
/* ------------------------------------------------------------------ */

/**
 * /MarkInfo << /Marked false >> : document NON taggé, conforme au niveau
 * PDF/A-3B (le tagging n'est exigé qu'au niveau A).
 */
export function markUnstructured(doc: PDFDocument): void {
  doc.catalog.set(PDFName.of("MarkInfo"), doc.context.obj({ Marked: false }));
}
