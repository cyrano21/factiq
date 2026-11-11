# Factiq — Facturation électronique conforme (France 2026-2027)

SaaS de facturation pour indépendants et micro-entrepreneurs français :
PDF professionnel avec **XML Factur-X (CII EN 16931) embarqué**, prêts pour
les plateformes agréées (PDP) de la réforme de facturation électronique
(réception obligatoire depuis le 01/09/2026, émission TPE/PME au 01/09/2027).

![stack](https://img.shields.io/badge/Next.js-16-black) ![stack](https://img.shields.io/badge/Prisma-SQLite-2D3748) ![stack](https://img.shields.io/badge/Factur--X-EN_16931-84cc16)

## Fonctionnalités opérationnelles

- **Landing animée** (framer-motion : reveals masqués, compteurs, smooth-scroll
  Lenis, tarifs, FAQ) — thème encre & lime, typographie éditoriale
- **Auth maison** : inscription/connexion, sessions httpOnly 30 j,
  scrypt + timing-safe compare
- **Clients** : CRUD complet (SIRET, adresse, TVA intracom)
- **Factures** : création multi-lignes, numérotation `FAC-AAAA-NNNN`,
  statuts brouillon / envoyée / payée, TVA standard (20/10/5,5 %) **ou
  franchise** (mention « TVA non applicable, art. 293 B du CGI »)
- **PDF Factur-X** : A4 professionnel avec pièce jointe `factur-x.xml`
  embarquée (format hybride lisible par l'humain et la machine)
- **XML CII EN 16931** téléchargeable séparément (D16B, codes catégorie S/E,
  exonération art. 293 B)
- **Dashboard** KPI (facturé TTC, en attente, encaissé, clients)
- **Plans Gratuit (5 factures) / Pro illimité**, pont **Stripe Checkout** réel
  (mode test) avec confirmation au retour

## Démarrage rapide

```bash
bun install
cp .env.example .env      # la valeur par défaut convient
bun run db:push           # crée db/custom.db (SQLite)
bun run db:seed           # comptes + clients + factures de démo
bun run dev               # http://localhost:3000
```

### Comptes de démonstration

| Compte | Mot de passe | Régime |
|---|---|---|
| `sophie@demo.fr` | `demo1234` | Franchise en base (art. 293 B) |
| `claire@demo.fr` | `demo1234` | Assujettie TVA 20 % |

### Activer Stripe Checkout (mode test)

```bash
export STRIPE_SECRET_KEY=sk_test_…
export STRIPE_PRICE_PRO=price_…        # abonnement Pro 9 €/mois
export STRIPE_PRICE_BUREAU=price_…     # Bureau 29 €/mois (optionnel)
```

Sans clé : le bouton de paiement affiche un message explicite (mode démo),
tout le reste de l'application reste fonctionnel.

## Tests

```bash
bun run test:e2e    # nécessite `bun run dev` actif sur :3000
```

22 vérifications de bout en bout : inscription, sessions, sécurité 401,
CRUD clients/factures, statuts, PDF valide + XML embarqué, XML CII bien
formé et totaux exacts, paramètres émetteur, pont Stripe, suppression.

## Architecture

```
src/
  app/page.tsx                 landing + app (client) + retour Stripe
  app/api/                     auth · clients · invoices (+pdf, +xml) · settings · billing
  components/factiq/           landing.tsx · app-shell.tsx · invoice-editor.tsx · panels
  components/landing/          primitives d'animation (FadeUp, CountUp, Ticker, SmoothScroll)
  lib/facturx.ts               générateur XML CII EN 16931 (profil EN 16931)
  lib/invoice-pdf.ts           PDF A4 (pdf-lib) + pièce jointe factur-x.xml
  lib/auth.ts                  scrypt + sessions en base
prisma/schema.prisma           User · Session · Client · Invoice · InvoiceLine
scripts/seed.ts                démo idempotente
```

## Roadmap

- Connexion PDP (plateforme agréée) pour la transmission fluide
- PDF/A-3 strict (OutputIntent + XMP Factur-X complet)
- Envoi des factures par e-mail, relances automatiques
- Notes de frais & acomptes
