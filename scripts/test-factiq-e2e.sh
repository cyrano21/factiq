#!/bin/bash
# Test E2E complet de Factiq — exécute tous les parcours critiques via l'API.
set -u
BASE="http://localhost:3000"
JAR="/tmp/factiq-test-cookies.txt"
rm -f "$JAR"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ❌ $1"; }
check() { # $1 label, $2 expected, $3 actual
  if [ "$2" = "$3" ]; then ok "$1 (HTTP $3)"; else bad "$1 — attendu $2, obtenu $3"; fi
}

echo "═══ 1. Page d'accueil ═══"
code=$(curl -s -o /tmp/factiq-home.html -w "%{http_code}" --max-time 20 "$BASE/")
check "GET /" 200 "$code"
grep -qi "Factiq" /tmp/factiq-home.html && ok "La page contient 'Factiq'" || bad "Nom 'Factiq' absent du HTML"

echo "═══ 2. Inscription d'un nouveau compte ═══"
EMAIL="test$(date +%s)@factiq-test.fr"
code=$(curl -s -c "$JAR" -o /tmp/reg.json -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test1234!\",\"name\":\"Utilisateur Test\"}")
check "POST /api/auth/register" 200 "$code"
grep -q '"email"' /tmp/reg.json && ok "Réponse contient le user" || bad "Réponse register invalide: $(head -c 200 /tmp/reg.json)"

echo "═══ 3. Session courante ═══"
code=$(curl -s -b "$JAR" -o /tmp/me.json -w "%{http_code}" "$BASE/api/auth/me")
check "GET /api/auth/me" 200 "$code"
grep -q "$EMAIL" /tmp/me.json && ok "Session reconnue ($EMAIL)" || bad "Session non reconnue"

echo "═══ 4. Sans session → 401 (sécurité) ═══"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/invoices")
check "GET /api/invoices sans cookie" 401 "$code"

echo "═══ 5. Création d'un client ═══"
code=$(curl -s -b "$JAR" -o /tmp/client.json -w "%{http_code}" -X POST "$BASE/api/clients" \
  -H "Content-Type: application/json" \
  -d '{"name":"Boulangerie Dupont","email":"compta@dupont.fr","address":"12 rue des Lilas","zip":"69003","city":"Lyon","siret":"12345678900019"}')
check "POST /api/clients" 200 "$code"
CLIENT_ID=$(python3 -c "import json;print(json.load(open('/tmp/client.json'))['client']['id'])" 2>/dev/null)
[ -n "$CLIENT_ID" ] && ok "Client créé (id ${CLIENT_ID:0:12}…)" || bad "Client non créé: $(head -c 200 /tmp/client.json)"

echo "═══ 6. Création d'une facture (2 lignes) ═══"
code=$(curl -s -b "$JAR" -o /tmp/inv.json -w "%{http_code}" -X POST "$BASE/api/invoices" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$CLIENT_ID\",\"lines\":[{\"description\":\"Prestation conseil\",\"quantity\":3,\"unitPrice\":450},{\"description\":\"Support mensuel\",\"quantity\":1,\"unitPrice\":150}],\"vatRate\":20,\"notes\":\"Merci de votre confiance.\"}")
check "POST /api/invoices" 200 "$code"
INV_ID=$(python3 -c "import json;print(json.load(open('/tmp/inv.json'))['invoice']['id'])" 2>/dev/null)
INV_NUM=$(python3 -c "import json;print(json.load(open('/tmp/inv.json'))['invoice']['number'])" 2>/dev/null)
[ -n "$INV_ID" ] && ok "Facture créée: $INV_NUM" || bad "Facture non créée: $(head -c 200 /tmp/inv.json)"

echo "═══ 7. Validation facture non authentifiée impossible (sécurité) ═══"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/invoices/$INV_ID/pdf")
check "PDF sans cookie" 401 "$code"

echo "═══ 8. Changement de statut ═══"
code=$(curl -s -b "$JAR" -o /tmp/patch.json -w "%{http_code}" -X PATCH "$BASE/api/invoices/$INV_ID" \
  -H "Content-Type: application/json" -d '{"status":"sent"}')
check "PATCH /api/invoices/[id] → sent" 200 "$code"

echo "═══ 9. Téléchargement PDF Factur-X ═══"
code=$(curl -s -b "$JAR" -o /tmp/facture-test.pdf -w "%{http_code}" "$BASE/api/invoices/$INV_ID/pdf")
check "GET /api/invoices/[id]/pdf" 200 "$code"
head -c 5 /tmp/facture-test.pdf | grep -q "%PDF" && ok "Fichier PDF valide ($(stat -c%s /tmp/facture-test.pdf) octets)" || bad "PDF invalide"
python3 - <<'EOF' && ok "XML factur-x.xml embarqué dans le PDF (streams décompressés)" || bad "XML non trouvé dans le PDF"
import re, zlib
data = open('/tmp/facture-test.pdf','rb').read()
found_name = b'factur-x.xml' in data
found_xml = b'CrossIndustryInvoice' in data
for m in re.finditer(rb'stream\r?\n', data):
    start = m.end(); end = data.find(b'endstream', start)
    if end == -1: continue
    try: dec = zlib.decompress(data[start:end])
    except Exception: continue
    if b'factur-x.xml' in dec: found_name = True
    if b'CrossIndustryInvoice' in dec: found_xml = True
assert found_name and found_xml, f"name={found_name} xml={found_xml}"
EOF

echo "═══ 10. XML Factur-X (CII EN 16931) ═══"
code=$(curl -s -b "$JAR" -o /tmp/facture.xml -w "%{http_code}" "$BASE/api/invoices/$INV_ID/xml")
check "GET /api/invoices/[id]/xml" 200 "$code"
python3 - <<'EOF' && ok "XML bien formé + totaux exacts (HT 1500, TVA 300, TTC 1800)" || bad "XML invalide ou totaux faux"
import xml.etree.ElementTree as ET
t = ET.parse('/tmp/facture.xml'); r = t.getroot()
ns = {'rsm':'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
      'ram':'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100'}
def val(path):
    e = r.find(path, ns); assert e is not None, f"nœud manquant: {path}"; return e.text
assert val('.//rsm:ExchangedDocument/ram:ID').startswith('FAC-'), "numéro absent"
assert val('.//ram:GrandTotalAmount') == '1800.00', f"TTC={val('.//ram:GrandTotalAmount')}"
assert val('.//ram:BasisAmount') == '1500.00'
assert val('.//ram:TaxTotalAmount') == '300.00'
assert val('.//ram:GuidelineSpecifiedDocumentContextParameter/ram:ID') == 'urn:factur-x.eu:1p0:facturx-en16931'
EOF

echo "═══ 11. Paramètres émetteur (SIRET etc.) ═══"
code=$(curl -s -b "$JAR" -o /tmp/set.json -w "%{http_code}" -X PATCH "$BASE/api/settings" \
  -H "Content-Type: application/json" \
  -d '{"legalName":"Studio Test SARL","siret":"98765432100011","vatMode":"standard","address":"1 avenue du Test","zip":"75011","city":"Paris","iban":"FR7630006000011234567890189"}')
check "PATCH /api/settings" 200 "$code"

echo "═══ 12. Pont Stripe (sans clé → message explicite) ═══"
code=$(curl -s -b "$JAR" -o /tmp/stripe.json -w "%{http_code}" -X POST "$BASE/api/billing/checkout" \
  -H "Content-Type: application/json" -d '{"plan":"pro"}')
check "POST /api/billing/checkout (mode démo)" 503 "$code"
grep -q "STRIPE_SECRET_KEY" /tmp/stripe.json && ok "Message d'aide Stripe clair" || bad "Message Stripe absent"

echo "═══ 13. Suppression de la facture de test ═══"
code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/invoices/$INV_ID")
check "DELETE /api/invoices/[id]" 200 "$code"

echo ""
echo "════════ RÉSULTAT : $PASS réussis, $FAIL échoués ════════"
exit $FAIL
