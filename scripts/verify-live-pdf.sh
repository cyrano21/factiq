#!/bin/bash
# verify-live-pdf.sh — gate N4 de node-1.2 (driver) : vérifie qu'un PDF
# réellement téléchargé depuis l'application (suite E2E, /tmp/facture-test.pdf,
# régénéré à chaque run) passe tous les contrôles PDF/A-3B de
# scripts/verify-pdf-a3.mjs. Succès : « live pdf verified ».
set -u
cd "$(dirname "$0")/.."

PDF=/tmp/facture-test.pdf
if [ ! -f "$PDF" ]; then
  echo "PDF introuvable : $PDF (lancez d'abord scripts/run-e2e-full.sh)"
  exit 1
fi
# Fraîcheur : moins de 30 minutes (sinon il peut provenir d'un ancien schéma).
age=$(( $(date +%s) - $(stat -c %Y "$PDF") ))
if [ "$age" -gt 1800 ]; then
  echo "PDF trop ancien (${age} s) — relancez scripts/run-e2e-full.sh"
  exit 1
fi
echo "PDF de l'application : $PDF ($(stat -c%s "$PDF") octets, ${age} s)"
bun scripts/verify-pdf-a3.mjs "$PDF" || exit 1
echo "live pdf verified"
