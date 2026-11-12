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
- **Monnaie en centimes entiers** : `unitPriceCents` / `vatRateCentiemes`
  (Int) en base, API et calculs — zéro arithmétique flottante sur l'argent
  (`src/lib/money.ts`, BR-CO-10/17) ; l'API refuse tout montant décimal
- **PDF Factur-X / PDF/A-3B** : A4 professionnel, polices embarquées, XMP
  `pdfaid:part=3` + bloc `fx:` Factur-X, pièce jointe `factur-x.xml` en
  `/AF` (`AFRelationship /Data` + `/UF`), OutputIntent ICC sRGB (format
  hybride lisible par l'humain et la machine) ; mentions obligatoires
  (escompte, pénalités de retard art. L441-10/D441-5)
- **XML CII EN 16931** téléchargeable séparément (D16B, codes catégorie S/E,
  exonération art. 293 B) + validateur structurel `validateFacturXXml`
  (BR-CO-10/11/12, guideline, TypeCode)
- **Dashboard** KPI (facturé TTC, en attente, encaissé, clients)
- **Plans Gratuit (5 factures) / Pro illimité**, pont **Stripe Checkout** réel
  (mode test) avec confirmation au retour
- **Conformité commerciale** : pages légales (mentions légales, CGV,
  politique de confidentialité RGPD), consentement à l'inscription, SEO
  (metadata OpenGraph, JSON-LD Application+FAQ, sitemap.xml, robots.txt)
- **Durcissement comptable** : factures émises inamovibles (pièce comptable,
  409), numérotation sur compteur persistant jamais réutilisé
  (`InvoiceCounter` + index unique), webhooks Stripe signés (HMAC),
  cookies `secure` en production, vérification TS au build, règles
  agents `AGENTS.md`

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
export STRIPE_WEBHOOK_SECRET=whsec_…   # webhook /api/billing/webhook
```

Sans clé : le bouton de paiement affiche un message explicite (mode démo),
tout le reste de l'application reste fonctionnel. L'upgrade de plan exige un
paiement `paid` (retour de checkout vérifié, ou webhook signé HMAC
`checkout.session.completed`).

## Tests

```bash
bun run test:e2e    # nécessite `next dev` actif sur :3000
```

28 vérifications de bout en bout : inscription, sessions, sécurité 401,
CRUD clients/factures, statuts, PDF valide + XML embarqué, XML CII bien
formé et totaux exacts, paramètres émetteur, pont Stripe, protection des
pièces comptables (suppression/refus rétrogradation 409), numérotation
sans réutilisation après suppression, suppression de brouillon.

## Architecture

```
src/
  app/page.tsx                 landing + app (client) + retour Stripe
  app/legal/                   mentions-légales · cgv · confidentialité (RGPD)
  app/sitemap.ts · robots.ts   SEO dynamique (NEXT_PUBLIC_SITE_URL)
  app/api/                     auth · clients · invoices (+pdf, +xml) · settings · billing
  components/factiq/           landing.tsx · app-shell.tsx · invoice-editor.tsx · panels
  components/legal/            briques de mise en page des documents légaux
  components/landing/          primitives d'animation (FadeUp, CountUp, Ticker, SmoothScroll)
  lib/facturx.ts               générateur XML CII EN 16931 (profil EN 16931)
  lib/invoice-pdf.ts           PDF A4 (pdf-lib) + pièce jointe factur-x.xml
  lib/auth.ts                  scrypt + sessions en base
prisma/schema.prisma           User · Session · Client · Invoice · InvoiceLine
scripts/seed.ts                démo idempotente
```

## Mise en production — checklist

Pour transformer cette base de code en activité qui encaisse, dans l'ordre :

1. **Domaine + hébergement.** Réserver le domaine (ex. factiq.fr) et déployer
   (VPS avec `bun run build && bun run start` derrière Caddy/Nginx, ou Vercel).
   Définir `NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr` (sitemap, robots,
   canoniques, OpenGraph).
2. **Stripe réel.** Compte Stripe → clés API live, créer deux produits à
   abonnement (Pro 9 €/mois, Bureau 29 €/mois), renseigner
   `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUREAU`.
   Tester d'abord en mode test (carte 4242 4242 4242 4242).
3. **Personnaliser les pages légales.** Chercher `[À compléter` dans
   `src/app/legal/` : identité éditeur (dénomination, forme, capital, RCS,
   SIREN, siège, TVA intracom), directeur de publication, hébergeur, e-mails
   de contact, médiateur de la consommation, tribunal compétent. La société
   exploitante doit exister juridiquement (micro-entreprise possible) pour
   encaisser légalement.
4. **Base de données.** SQLite convient pour démarrer (TPE, trafic modéré) ;
   passer à PostgreSQL (Prisma `provider = "postgresql"`) pour la haute
   disponibilité et les sauvegardes managées.
5. **Email transactionnel** (Resend, Brevo…) pour la bienvenue, les factures
   d'abonnement et les reçus Stripe.
6. **Référencement.** Soumettre le sitemap à Google Search Console, créer
   les pages de contenu SEO (« facture électronique micro-entrepreneur »,
   « réforme 2027 », « Factur-X ») pour l'acquisition organique.
7. **PDP.** Signer un partenariat avec une plateforme agréée pour la
   transmission (route vers 2027), Factiq produit déjà les fichiers
   conformes.

## Roadmap

- ~~PDF/A-3B (OutputIntent ICC + XMP Factur-X + AF/AFRelationship)~~ **fait** ;
  reste : validation XSD/Schematron EN 16931 (outils FNFE-MPE), mentions
  complémentaires (nature de l'opération, adresse de livraison, TVA sur les
  débits)
- ~~Montants en centimes entiers (`Int`)~~ **fait** ; reste : multi-taux de
  TVA par facture
- Devis → facture, avoirs, paiements partiels, factures récurrentes,
  relances, export comptable / archivage 10 ans
- Connexion PDP (plateforme agréée) pour la transmission fluide
- Envoi des factures par e-mail, relances automatiques

## Règles agents

Voir `AGENTS.md` : règles strictes propres aux documents comptables
(immuabilité des factures émises, numérotation, montants, mentions
légales, sécurité) — à lire avant toute contribution automatisée.
