#!/bin/bash
# Orchestration E2E complète — réservée au driver / nœuds d'intégration unlazy
# (une feuille n'a jamais le droit de démarrer un serveur).
# 1) arrêt propre de tout ancien serveur :3000  2) démarrage détaché
# (technique anti-tee validée : setsid nohup, sortie dans /tmp/factiq-dev.log)
# 3) attente du 200  4) suite E2E  5) « E2E PASS » uniquement si 0 échec.
set -u
cd "$(dirname "$0")/.."

pkill -f "next dev -p 3000" 2>/dev/null || true
sleep 1

setsid nohup ./node_modules/.bin/next dev -p 3000 </dev/null >> /tmp/factiq-dev.log 2>&1 &
disown

ready=""
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000/ 2>/dev/null || true)
  if [ "$code" = "200" ]; then ready=1; break; fi
  sleep 1
done
if [ -z "$ready" ]; then
  echo "E2E FAIL : serveur non prêt après 90 s"
  tail -20 /tmp/factiq-dev.log
  exit 1
fi
echo "Serveur prêt (http://localhost:3000, ${i} s)"

bash scripts/test-factiq-e2e.sh
rc=$?
if [ "$rc" -eq 0 ]; then
  echo "E2E PASS"
  exit 0
fi
echo "E2E FAIL ($rc échec(s))"
exit 1
