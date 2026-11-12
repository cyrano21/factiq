# AGENTS.md — Factiq

Règles pour tout agent (humain ou IA) travaillant sur ce dépôt. Factiq produit
des **documents comptables** : ces règles sont plus strictes que pour un site
vitrine ou un e-commerce. Elles priment sur toute commodité de développement.

## 1. Intégrité des documents comptables (non négociable)

- **Jamais supprimer une facture émise** (status `sent` ou `paid`). Seuls les
  brouillons sont supprimables. Une erreur s'annule par un **avoir**
  (roadmap), jamais par une destruction (art. L123-22 du code de commerce :
  conservation 10 ans).
- **Jamais réutiliser un numéro de facture.** La numérotation `FAC-AAAA-NNNN`
  repose sur un compteur persistant `InvoiceCounter` (userId + année),
  incrémenté atomiquement et qui ne décroît jamais — même après suppression
  d'un brouillon. Index unique `@@unique([userId, number])` en garde-fou.
  Toute évolution doit préserver la continuité et l'unicité de la
  numérotation ; en cas de collision P2002, on régénère (retry 3×).
- **Jamais ramener une facture émise en brouillon** (PATCH `status` → 409).
- Les documents déjà émis sont immuables : toute correction = document
  rectificatif ou avoir, avec référence à la facture d'origine.

## 2. Argent et calculs

- Les montants sont des **nombre décimaux monétaires** : tout calcul passe par
  `round2()` (centimes) et tout affichage via `Intl.NumberFormat("fr-FR")`.
- La refonte **centimes entiers (Int)** est la cible : ne jamais ajouter de
  nouveau champ monétaire en Float.
- Un seul taux de TVA par facture actuellement (contrainte du schéma) : ne pas
  émettre de facture multi-taux sans refonte préalable des totaux
  (EN 16931 exige des totaux par taux).
- Toute modification de calcul doit être couverte par le test E2E des totaux
  (HT 1500 / TVA 300 / TTC 1800 au minimum) et par un cas d'arrondi.

## 3. Conformité réglementaire (France)

- XML : CII EN 16931 (D16B), guideline `urn:factur-x.eu:1p0:facturx-en16931`.
- Franchise : mention « TVA non applicable, art. 293 B du CGI » + code
  d'exonération catégorie S — ne jamais l'enlever.
- PDF : la cible est **PDF/A-3B avec métadonnées XMP Factur-X** et fichier
  associé `AFRelationship = Alternate`. Toute évolution du PDF doit garder le
  XML embarqué vérifié par `test:e2e` (streams zlib décompressés).
- Ne jamais promettre la « conformité complète » ou le transit PDP dans le
  produit ou la com : Factiq prépare des fichiers conformes, la transmission
  passe par une plateforme agréée.
- Toute mention légale nouvelle (SIREN client, nature de l'opération, adresse
  de livraison, TVA sur les débits) doit être ajoutée au PDF **et** au XML
  simultanément, documentée, et testée.

## 4. Sécurité

- Cookie de session : `httpOnly`, `sameSite: lax`, `secure` en production.
  Ne jamais régresser.
- Toute route API exige l'authentification sauf register/login/webhook (celui-ci
  vérifié par signature HMAC Stripe). Aucun endpoint de document sans
  vérification de propriété (`userId`).
- Upgrade de plan : uniquement `payment_status === "paid"` (return URL ou
  webhook signé). Jamais sur `status === "complete"` seul.
- `typescript.ignoreBuildErrors` est supprimé et doit le rester : les erreurs
  TS bloquent le build.
- Aucune clé secrète dans le code, jamais de log de token/montant complet.

## 5. Base de données

- `db:push --accept-data-loss` est réservé au développement local : ne jamais
  l'exécuter sur une base contenant des données réelles sans sauvegarde et
  revue du diff de schéma.
- Toute migration de données réelles passe par un script de migration
  versionné (backup → script → vérification du nombre de lignes).

## 6. Tests et livraison

- `bunx tsc --noEmit` sans erreur sur `src/` avant tout commit.
- `bun run test:e2e` (22+ vérifications) vert avant tout commit touchant les
  routes API, le PDF, le XML ou la facturation.
- Les pages `/legal/*` contiennent des emplacements `[À compléter]` : ne jamais
  supprimer ces marqueurs ni remplir une identité fictive — ils sont destinés
  à l'exploitant réel.
- Chaque commit doit pouvoir être déployé sans étape manuelle cachée.

## 7. Architecture (repères)

- `src/lib/facturx.ts` — XML CII + `computeTotals` (source unique des totaux).
- `src/lib/invoice-pdf.ts` — PDF A4 (pdf-lib) + EmbeddedFile factur-x.xml.
- `src/lib/invoice-service.ts` — chargement, propriété, numérotation.
- `src/lib/auth.ts` — scrypt + sessions en base.
- `src/app/api/billing/*` — checkout (REST Stripe sans SDK), confirm (retour),
  webhook (cycle de vie signé).
