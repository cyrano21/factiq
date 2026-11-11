import type { Metadata } from "next";
import {
  DocHeader,
  Fill,
  H2,
  H3,
  LegalLink,
  LI,
  Notice,
  P,
  UL,
} from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Politique de confidentialité (RGPD)",
  description:
    "Comment Factiq collecte, utilise et protège vos données personnelles : finalités, bases légales, conservation, sous-traitants, droits RGPD et contact.",
};

export default function ConfidentialitePage() {
  return (
    <article>
      <DocHeader
        tag="Protection des données"
        title="Politique de confidentialité"
        intro="Cette politique décrit, conformément au règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 modifiée, la manière dont vos données personnelles sont collectées et traitées par Factiq."
      />

      <Notice>
        Modèle à personnaliser avant mise en production&nbsp;: identité du
        responsable de traitement (renvoi aux{" "}
        <LegalLink href="/legal/mentions-legales">mentions légales</LegalLink>),
        e-mail de contact privacy et hébergeur réel. Si le traitement des données
        clients de vos utilisateurs devient le cœur du service, une étude d'AIPD peut
        être nécessaire.
      </Notice>

      <H2>1. Responsable de traitement</H2>
      <P>
        Le responsable de traitement est <Fill t="dénomination sociale de l'éditeur" />,
        dont le siège est situé <Fill t="adresse du siège" />, joignable à{" "}
        <Fill t="e-mail de contact privacy" /> pour toute question relative aux
        données personnelles ou à l'exercice de vos droits.
      </P>

      <H2>2. Données collectées</H2>
      <H3>2.1 Données de compte</H3>
      <UL>
        <li>adresse e-mail (identification et communications du service)&nbsp;;</li>
        <li>nom complet (affichage sur les factures)&nbsp;;</li>
        <li>
          mot de passe, uniquement sous forme d'empreinte irréversible (dérivation
          scrypt avec sel aléatoire)&nbsp;: aucun mot de passe n'est jamais stocké ni
          lu en clair&nbsp;;
        </li>
        <li>
          identité d'émetteur que vous complétez volontairement&nbsp;: SIRET, numéro
          de TVA, adresse, IBAN (mentions légales de vos factures).
        </li>
      </UL>
      <H3>2.2 Données métier</H3>
      <P>
        Clients, factures et lignes de facturation que vous saisissez (montants, TVA,
        échéances). Ces données sont les vôtres&nbsp;; elles ne sont ni revendues, ni
        exploitées à des fins publicitaires ou d'entraînement de modèles.
      </P>
      <H3>2.3 Données techniques</H3>
      <P>
        Identifiant de session (cookie strictement technique, httpOnly, expirant sous
        30 jours, indispensable à l'authentification). Aucun cookie publicitaire, de
        réseau social ou de mesure d'audience tierce n'est déposé. Les journaux
        techniques de l'hébergeur (adresses IP, horodatages) sont conservés par
        l'hébergeur à des fins de sécurité.
      </P>

      <H2>3. Finalités et bases légales</H2>
      <UL>
        <li>
          Fournir le service (gestion de compte, génération de factures)&nbsp;:
          exécution du contrat (art. 6-1-b RGPD).
        </li>
        <li>
          Traiter les abonnements payants via Stripe&nbsp;: exécution du contrat et
          obligation légale de comptabilisation.
        </li>
        <li>
          Sécuriser le service (authentification, prévention des abus)&nbsp;:
          intérêt légitime (art. 6-1-f).
        </li>
        <li>
          Répondre aux demandes des autorités, le cas échéant&nbsp;: obligation
          légale (art. 6-1-c).
        </li>
      </UL>

      <H2>4. Destinataires et sous-traitants</H2>
      <UL>
        <li>
          <span className="font-medium text-foreground">Hébergeur</span>&nbsp;:{" "}
          <Fill t="nom et pays de l'hébergeur" />, qui conserve les données sur des
          serveurs sécurisés.
        </li>
        <li>
          <span className="font-medium text-foreground">Stripe</span>&nbsp;: Stripe
          Payments Europe traite les paiements en qualité de responsable de
          traitement autonome&nbsp;; ses garanties figurent dans sa propre politique
          de confidentialité. Les coordonnées bancaires complètes ne transitent pas
          par Factiq.
        </li>
      </UL>
      <P>
        Aucun transfert hors Union européenne n'est effectué par l'éditeur en dehors
        des prestataires cités ci-dessus, le cas échéant encadrés par les clauses
        contractuelles types de la Commission européenne.
      </P>

      <H2>5. Durées de conservation</H2>
      <UL>
        <li>
          Données de compte et données métier&nbsp;: pendant la durée d'utilisation du
          compte, puis suppression sur demande (les pièces comptables que vous émettez
          relèvent de vos propres obligations de conservation, 10 ans pour les
          documents comptables)&nbsp;;
        </li>
        <li>Sessions d'authentification&nbsp;: 30 jours maximum&nbsp;;</li>
        <li>Journaux techniques d'hébergement&nbsp;: selon la politique de l'hébergeur.</li>
      </UL>

      <H2>6. Sécurité</H2>
      <P>
        Les mots de passe sont protégés par dérivation scrypt avec sel unique, les
        comparaisons sont à temps constant et les sessions reposent sur des cookies
        httpOnly. L'accès applicatif aux données est cloisonné par utilisateur&nbsp;:
        chacun ne peut consulter que ses propres clients et factures. La
        confidentialité reste malgré tout soumise aux risques résiduels inhérents à
        tout service en ligne&nbsp;: signalez toute anomalie à{" "}
        <Fill t="e-mail de contact privacy" />.
      </P>

      <H2>7. Vos droits</H2>
      <P>
        Vous disposez des droits d'accès, de rectification, d'effacement, de
        limitation, d'opposition et de portabilité sur vos données. Pour les
        exercer, écrivez à <Fill t="e-mail de contact privacy" />&nbsp;: une réponse
        vous sera apportée dans un délai d'un mois. Vous pouvez également introduire
        une réclamation auprès de la CNIL (3 place de Fontenoy, TSA 80715, 75334
        Paris Cedex 07 — cnil.fr).
      </P>
    </article>
  );
}
