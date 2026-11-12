#!/usr/bin/env bun
/**
 * verify-pdf-a3.mjs — vérifie qu'un PDF est un Factur-X PDF/A-3B complet.
 * Usage : bun scripts/verify-pdf-a3.mjs [/tmp/factiq-sample.pdf]
 *
 * Contrôles (binaires, sur les octets lus en latin1) :
 *   1. en-tête %PDF- ;
 *   2. XMP : pdfaid:part=3 ET pdfaid:conformance=B ;
 *   3. fx:DocumentType INVOICE ;
 *   4. fx:DocumentFileName factur-x.xml ;
 *   5. fx:ConformanceLevel EN 16931 ;
 *   6. /AFRelationship /Data ;
 *   7. /UF décodable en « factur-x.xml » (UTF-16BE) ;
 *   8. name tree /Names /EmbeddedFiles contenant factur-x.xml ;
 *   9. /OutputIntents avec /GTS_PDFA1 et /DestOutputProfile ;
 *  10. /FontFile2 présent au moins 2 fois (regular + bold) ;
 *  11. AUCUNE occurrence de /Helvetica (preuve que les base-14 ont disparu) ;
 *  12. stream /Metadata (XMP) présent, /Subtype /XML ;
 *  13. XML CII embarqué décompressé (CrossIndustryInvoice + GUIDeline) ;
 *  14. chaque phrase de MENTIONS_OBLIGATOIRES est bien exportée par le
 *      module (le texte 7 pt est passé à drawText dans la zone mentions ;
 *      le contrôle du rendu dessiné reste la gate manuelle G3 du driver).
 */
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { MENTIONS_OBLIGATOIRES } from "../src/lib/invoice-pdf.ts";
import { validateFacturXXml } from "../src/lib/facturx.ts";

const chemin = process.argv[2] ?? "/tmp/factiq-sample.pdf";
const problemes = [];
const controler = (ok, message) => {
  if (!ok) problemes.push(message);
};

const bytes = readFileSync(chemin);
const txt = bytes.toString("latin1");

/* 1. En-tête PDF */
controler(
  txt.slice(0, 5) === "%PDF-",
  `En-tête %PDF- absent (les 5 premiers octets sont « ${JSON.stringify(txt.slice(0, 5))} »).`
);

/* 2. Identification PDF/A dans le XMP */
controler(
  /pdfaid:part>\s*3\s*</.test(txt),
  "XMP : pdfaid:part=3 absent (le document ne s'identifie pas comme PDF/A-3)."
);
controler(
  /pdfaid:conformance>\s*B\s*</.test(txt),
  "XMP : pdfaid:conformance=B absent (niveau B attendu)."
);

/* 3-5. Bloc Factur-X du XMP */
controler(
  /fx:DocumentType>\s*INVOICE\s*</.test(txt),
  "XMP : fx:DocumentType INVOICE absent."
);
controler(
  /fx:DocumentFileName>\s*factur-x\.xml\s*</.test(txt),
  "XMP : fx:DocumentFileName factur-x.xml absent."
);
controler(
  /fx:ConformanceLevel>\s*EN 16931\s*</.test(txt),
  "XMP : fx:ConformanceLevel « EN 16931 » absent."
);

/* 6. AFRelationship /Data */
controler(
  /\/AFRelationship\s*\/Data/.test(txt),
  "Filespec : /AFRelationship /Data absent (relation de la pièce jointe factur-x.xml)."
);

/* 7. /UF décodable en factur-x.xml */
const ufMatch = /\/UF\s*<([0-9A-Fa-f]+)>/.exec(txt);
let ufNom = "";
if (ufMatch) {
  let hex = ufMatch[1];
  if (hex.startsWith("FEFF")) hex = hex.slice(4);
  for (let i = 0; i + 3 < hex.length; i += 4) {
    ufNom += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
  }
}
controler(
  ufNom === "factur-x.xml",
  `Filespec : /UF absent ou différent de « factur-x.xml » (décodé : « ${ufNom || "<vide>"} »).`
);

/* 8. Name tree /Names /EmbeddedFiles avec factur-x.xml */
controler(
  /\/EmbeddedFiles/.test(txt),
  "Catalogue : dictionnaire /EmbeddedFiles absent de /Names."
);
controler(
  /\/EmbeddedFiles[\s\S]{0,200}?\(factur-x\.xml\)/.test(txt),
  "Name tree /EmbeddedFiles : la clé « factur-x.xml » est absente (fichier non enregistré dans l'arbre de noms)."
);
controler(
  /\(factur-x\.xml\)[\s\S]{0,40}\d+ 0 R/.test(txt),
  "Name tree /EmbeddedFiles : la clé « factur-x.xml » ne référence aucune Filespec."
);

/* 9. OutputIntent PDF/A */
controler(
  /\/OutputIntents/.test(txt),
  "Catalogue : /OutputIntents absent (profil de sortie PDF/A manquant)."
);
controler(
  /\/GTS_PDFA1/.test(txt),
  "OutputIntent : /S /GTS_PDFA1 absent."
);
controler(
  /\/DestOutputProfile/.test(txt),
  "OutputIntent : /DestOutputProfile absent (aucun profil ICC de sortie)."
);

/* 9bis. Le profil ICC embarqué est un VRAI profil ICC (défaut réel trouvé
 * en intégration : Turbopack avait résolu l'asset vers une police — le dict
 * /N 3 contenait 708 Ko de TrueType et poppler rejetait « not an ICC
 * profile »). Contrôles : le stream DestOutputProfile commence par une taille
 * ICC plausible, contient la signature 'acsp' à l'offset 36 et fait moins de
 * 100 Ko (un ICC sRGB ≈ 2 à 60 Ko, une police en fait 100 000 fois plus). */
{
  const refM = txt.match(/\/DestOutputProfile\s+(\d+)\s+0\s+R/);
  controler(refM != null, "OutputIntent : référence DestOutputProfile illisible.");
  if (refM) {
    const objM = new RegExp(`\\n${refM[1]} 0 obj`).exec(txt);
    controler(objM != null, `OutputIntent : l'objet ${refM[1]} (DestOutputProfile) est absent du fichier.`);
    if (objM) {
      const streamStart = txt.indexOf("stream\n", objM.index) + 7;
      const streamEnd = txt.indexOf("endstream", streamStart);
      const icc = bytes.subarray(streamStart, streamStart + Math.min(64, Math.max(0, streamEnd - streamStart)));
      const lenM = txt.slice(objM.index, objM.index + 200).match(/\/Length\s+(\d+)/);
      const iccLength = lenM ? Number(lenM[1]) : 0;
      controler(
        iccLength > 100 && iccLength < 100_000,
        `Profil ICC : taille ${iccLength} octet(s) implausible (attendu ~2-60 Ko) — l'asset embarqué n'est pas un profil ICC.`
      );
      controler(
        icc.subarray(36, 40).toString("latin1") === "acsp",
        `Profil ICC : signature 'acsp' absente à l'offset 36 (trouvé « ${icc.subarray(36, 40).toString("latin1")} ») — l'asset embarqué n'est pas un profil ICC.`
      );
    }
  }
}

/* 10. Polices embarquées */
const nbFontFile2 = (txt.match(/\/FontFile2/g) ?? []).length;
controler(
  nbFontFile2 >= 2,
  `Polices embarquées insuffisantes : /FontFile2 présent ${nbFontFile2}× (attendu ≥ 2 : DejaVu regular + bold).`
);

/* 11. Aucune police base-14 Helvetica */
const nbHelvetica = (txt.match(/\/Helvetica/g) ?? []).length;
controler(
  nbHelvetica === 0,
  `Police base-14 détectée : /Helvetica apparaît ${nbHelvetica}× (interdite en PDF/A, polices non embarquées).`
);

/* 12. Stream XMP /Metadata */
controler(
  /\/Type\s*\/Metadata/.test(txt) && /\/Subtype\s*\/XML/.test(txt),
  "Stream /Metadata (XMP, /Subtype /XML) absent du catalogue."
);

/* 13. XML CII embarqué (stream EmbeddedFile décompressé) */
function extraireXmlEmbarque(b) {
  const s = b.toString("latin1");
  const re = /\/Subtype\s*\/text#2Fxml[\s\S]{0,400}?stream\r?\n/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    // /Length du dictionnaire (fiable) sinon recherche de endstream.
    const zoneDict = s.slice(Math.max(0, m.index - 400), m.index);
    const lm = /\/Length\s+(\d+)/.exec(zoneDict);
    const debut = m.index + m[0].length;
    let contenu;
    if (lm) {
      contenu = b.subarray(debut, debut + parseInt(lm[1], 10));
    } else {
      const fin = s.indexOf("endstream", m.index);
      if (fin === -1) continue;
      contenu = b.subarray(debut, fin);
    }
    try {
      return inflateSync(contenu).toString("latin1");
    } catch {
      // Stream non compressé ou corrompu — on renvoie le brut.
      return contenu.toString("latin1");
    }
  }
  return "";
}
const xmlEmbarque = extraireXmlEmbarque(bytes);
controler(
  xmlEmbarque.includes("CrossIndustryInvoice"),
  "Pièce jointe : le stream EmbeddedFile (text/xml) n'a pas pu être décompressé ou ne contient pas de <CrossIndustryInvoice>."
);
controler(
  xmlEmbarque.includes("urn:factur-x.eu:1p0:facturx-en16931"),
  "Pièce jointe : le XML CII embarqué ne porte pas la GUIDeline EN 16931 (urn:factur-x.eu:1p0:facturx-en16931)."
);

/* 13 bis. Validation structurelle complète du XML embarqué (EN 16931) */
if (xmlEmbarque.includes("CrossIndustryInvoice")) {
  const validationXml = validateFacturXXml(xmlEmbarque);
  controler(
    validationXml.ok,
    `Pièce jointe : le XML CII embarqué échoue à la validation structurelle EN 16931 : ${JSON.stringify(validationXml.errors)}`
  );
}

/* 14. Mentions obligatoires (constante exportée du module PDF) */
controler(
  Array.isArray(MENTIONS_OBLIGATOIRES) && MENTIONS_OBLIGATOIRES.length >= 2,
  "MENTIONS_OBLIGATOIRES : la constante exportée doit contenir au moins l'escompte et les pénalités de retard."
);
for (const phrase of MENTIONS_OBLIGATOIRES ?? []) {
  controler(
    typeof phrase === "string" && phrase.trim().length > 0,
    "MENTIONS_OBLIGATOIRES contient une phrase vide."
  );
}
controler(
  (MENTIONS_OBLIGATOIRES ?? []).some((p) => p.includes("Escompte pour paiement anticipé")),
  "MENTIONS_OBLIGATOIRES : la mention d'escompte (« Escompte pour paiement anticipé : néant ») est absente."
);
controler(
  (MENTIONS_OBLIGATOIRES ?? []).some(
    (p) => p.includes("Pénalités de retard") && p.includes("40 €")
  ),
  "MENTIONS_OBLIGATOIRES : la mention pénalités/indemnité forfaitaire 40 € est absente."
);

/* Verdict */
if (problemes.length > 0) {
  console.error(`verify-pdf-a3 : ${problemes.length} contrôle(s) en échec sur ${chemin} :`);
  for (const p of problemes) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`Sample vérifié : ${chemin} (${bytes.length} octets) — ${MENTIONS_OBLIGATOIRES.length} mentions obligatoires exportées.`);
console.log("pdfa3 verified");
