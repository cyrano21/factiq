#!/bin/bash
# check-pushed.sh — gate R3 de la racine (driver) : tout est commité et poussé.
# Succès : « pushed » uniquement si aucun commit local non poussé et si
# l'arbre de travail est propre (hors .unlazy/, .next/, db backups ignorés).
set -u
cd "$(dirname "$0")/.."

git fetch origin -q || { echo "fetch impossible"; exit 1; }

NON_PUSHE=$(git log origin/main..HEAD --oneline | wc -l)
if [ "$NON_PUSHE" -ne 0 ]; then
  echo "push requis : $NON_PUSHE commit(s) local(aux) non poussé(s)"
  exit 1
fi

DIRTY=$(git status --porcelain | grep -v "^?? \.unlazy/" | wc -l)
if [ "$DIRTY" -ne 0 ]; then
  echo "arbre de travail sale :"
  git status --porcelain | grep -v "^?? \.unlazy/"
  exit 1
fi

echo "pushed"
