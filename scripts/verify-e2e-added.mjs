#!/bin/sh
// 2>/dev/null; exec node "$0" "$@" || exec bun "$0" "$@"
/**
 * Vérification de l'extension du script E2E (gate G2 de leaf-1.1.2).
 *
 * Note d'implémentation : la gate G2 exécute ce fichier via
 * `bash scripts/verify-e2e-added.mjs`. La ligne 2 est donc un pas-de-deux
 * polyglotte — bash ignore la commande `//` (stderr masqué) puis ré-exécute
 * le fichier sous node ; pour node/bun, la ligne 2 est un simple commentaire.
 *
 * Contrôles :
 *   1. `bash -n scripts/test-factiq-e2e.sh` — le script E2E reste
 *      syntaxiquement valide ;
 *   2. présence des 8 nouveaux marqueurs de cas (@cas VAL-01 … VAL-08),
 *      recherchés avec ripgrep (rg), avec repli sur une lecture brute du
 *      fichier si rg est indisponible.
 *
 * Succès : affiche exactement « e2e cases added » (exit 0).
 * Échec  : affiche le contrôle fautif (exit 1).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const e2ePath = join(scriptDir, "test-factiq-e2e.sh");

/* 1. Syntaxe bash du script E2E. */
const syntax = spawnSync("bash", ["-n", e2ePath], { encoding: "utf8" });
if (syntax.error) {
  console.error(`❌ bash indisponible pour -n : ${syntax.error.message}`);
  process.exit(1);
}
if (syntax.status !== 0) {
  console.error(
    `❌ scripts/test-factiq-e2e.sh : erreur de syntaxe bash\n${syntax.stderr || syntax.stdout}`
  );
  process.exit(1);
}

/* 2. Les 8 nouveaux marqueurs de cas. */
const MARKERS = [
  "VAL-01", // POST facture quantity négative → 400
  "VAL-02", // POST vatRate 150 → 400
  "VAL-03", // POST dueDate < issueDate → 400
  "VAL-04", // POST description vide → 400
  "VAL-05", // POST client inconnu → 400
  "VAL-06", // PATCH sent→draft → 409
  "VAL-07", // PATCH paid→sent → 409
  "VAL-08", // DELETE brouillon → 200 puis numéro non réutilisé
];

const content = readFileSync(e2ePath, "utf8");
const missing = [];

for (const marker of MARKERS) {
  let found = false;
  if (spawnSync("rg", ["-q", `@cas ${marker}\\b`, e2ePath]).status === 0) {
    found = true;
  } else if (content.includes(`@cas ${marker}`)) {
    // Repli si rg est absent : lecture brute du fichier.
    found = true;
  }
  if (!found) {
    missing.push(marker);
  } else {
    console.log(`  ✓ marqueur présent : @cas ${marker}`);
  }
}

if (missing.length > 0) {
  console.error(`❌ marqueurs de cas absents du script E2E : ${missing.join(", ")}`);
  process.exit(1);
}
console.log("e2e cases added");
