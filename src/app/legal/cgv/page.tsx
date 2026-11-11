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
  title: "Conditions générales de vente",
  description:
    "CGV du service Factiq : abonnements, tarifs, paiement via Stripe, résiliation, rétractation, responsabilité et droit applicable.",
};

export default function CgvPage() {
  return (
    <article>
      <DocHeader
        tag="Contrat d'utilisation"
        title="Conditions générales de vente"
        intro="Les présentes conditions régissent l'accès au Service Factiq et la souscription de ses abonnements payants. Elles s'appliquent sans exception à tout utilisateur."
      />

      <Notice>
        Modèle de référence à personnaliser avant mise en production&nbsp;: identité de
        l'éditeur (renvoi aux <LegalLink href="/legal/mentions-legales">mentions
        légales</LegalLink>), coordonnées de contact et de médiation. En cas de doute
        sur une clause, faites valider les CGV par un professionnel du droit.
      </Notice>

      <H2>1. Objet et acceptation</H2>
      <P>
        Les présentes conditions générales de vente (les « CGV ») encadrent la
        fourniture du Service Factiq, outil de génération de factures électroniques
        au format Factur-X (PDF avec XML CII EN 16931 embarqué), édité par{" "}
        <Fill t="dénomination sociale de l'éditeur" />. La création d'un compte ou la
        souscription d'un abonnement emporte acceptation pleine et entière des CGV,
        dont la version en ligne prévaut sur toute autre version.
      </P>

      <H2>2. Compte utilisateur</H2>
      <P>
        L'accès au Service suppose la création d'un compte avec une adresse e-mail
        valide et un mot de passe d'au moins huit caractères. L'utilisateur est
        responsable de la confidentialité de ses identifiants et de l'activité
        réalisée sous son compte. Il s'engage à fournir des informations exactes et à
        ne pas créer de compte au nom d'un tiers sans mandat.
      </P>

      <H2>3. Description des formules</H2>
      <UL>
        <li>
          <span className="font-medium text-foreground">Gratuit</span>&nbsp;: accès aux
          fonctionnalités principales dans la limite de 5 factures.
        </li>
        <li>
          <span className="font-medium text-foreground">Pro (9 € TTC/mois)</span>
          &nbsp;: factures et exports illimités, relances et suivi des statuts de
          paiement, support prioritaire.
        </li>
        <li>
          <span className="font-medium text-foreground">Bureau (29 € TTC/mois)</span>
          &nbsp;: l'ensemble du plan Pro avec gestion multi-sociétés, assistance à la
          transmission via plateforme agréée et export comptable.
        </li>
      </UL>
      <P>
        Les fonctionnalités des formules sont décrites sur la page commerciale du
        Service, qui fait partie intégrante des présentes. Les tarifs s'entendent en
        euros, toutes taxes comprises, pour la TVA française au taux applicable&nbsp;;
        le détail des taxes figure sur la facture d'abonnement remise après paiement.
      </P>

      <H2>4. Paiement</H2>
      <P>
        Les abonnements payants sont souscrits pour une durée d'un mois, renouvelable
        automatiquement à chaque échéance jusqu'à résiliation. Le paiement est
        effectué par carte bancaire via la plateforme Stripe Payments Europe
        («&nbsp;Stripe&nbsp;»), prestataire de paiement agréé&nbsp;; Factiq ne stocke
        aucune donnée de carte bancaire sur ses serveurs. La facture d'abonnement est
        disponible sur demande auprès de <Fill t="e-mail de contact" />.
      </P>
      <P>
        Le défaut de paiement d'une échéance entraîne la suspension de l'accès aux
        fonctionnalités payantes jusqu'à régularisation, sans que la responsabilité de
        l'éditeur puisse être recherchée à ce titre.
      </P>

      <H2>5. Durée, renouvellement et résiliation</H2>
      <P>
        L'abonnement court mois par mois à compter de la souscription. L'utilisateur
        peut résilier à tout moment, sans frais&nbsp;: l'abonnement prend fin à la
        clôture de la période en cours, aucune réfaction n'étant due pour la période
        déjà entamée. La résiliation s'effectue par l'interface du Service ou par
        demande écrite à <Fill t="e-mail de contact" />. Après résiliation, les
        fonctionnalités illimitées cessent et le compte repasse sur la formule
        Gratuite&nbsp;; les documents déjà émis restent téléchargeables.
      </P>
      <P>
        L'éditeur peut suspendre ou clôturer un compte en cas de violation manifeste
        des CGV, après notification restée sans effet pendant 48 heures, et rembourser
        au prorata les périodes payées et non consommées le cas échéant.
      </P>

      <H2>6. Droit de rétractation</H2>
      <P>
        Conformément à l'article L221-18 du code de la consommation, le consommateur
        dispose de 14 jours à compter de la souscription pour se rétracter sans motif
        ni pénalité, en écrivant à <Fill t="e-mail de contact" />. Conformément à
        l'article L221-28 du même code, le droit de rétractation ne peut plus être
        exercé après la fourniture intégrale du contenu numérique et la renonciation
        expresse à ce droit par l'utilisateur. Les utilisateurs agissant à des fins
        professionnelles (commerçants, professions libérales, micro-entrepreneurs)
        sont hors du champ de la consommation et ne bénéficient pas de ce droit.
      </P>

      <H2>7. Disponibilité et limites du Service</H2>
      <P>
        Le Service est fourni «&nbsp;en l'état&nbsp;» avec une obligation de moyens.
        L'éditeur s'efforce d'assurer une disponibilité continue mais ne garantit pas
        une accessibilité ininterrompue (maintenance, force majeure, dépendances
        tierces). Factiq produit des fichiers conformes à la norme EN 16931 mais
        n'est pas une plateforme agréée (PDP)&nbsp;: la transmission des factures dans
        le cadre de la réforme de facturation électronique relève de l'utilisateur ou
        du prestataire de transmission qu'il choisit.
      </P>
      <P>
        L'utilisateur est seul responsable de la vérification des mentions de ses
        factures (identifiants, TVA, numérotation) avant envoi à ses clients, et du
        maintien de ses propres sauvegardes&nbsp;; des exports PDF/XML sont fournis à
        cet effet.
      </P>

      <H2>8. Responsabilité</H2>
      <P>
        La responsabilité de l'éditeur ne peut être recherchée qu'en cas de faute
        avérée et se limite, tous dommages confondus, aux sommes effectivement
        perçues au titre de l'abonnement au cours des douze derniers mois. L'éditeur
        est exclu de toute responsabilité pour les dommages indirects (perte de
        données, perte d'exploitation, amendes fiscales), pour les contenus saisis
        par l'utilisateur, et pour l'usage du Service en contradiction avec les
        présentes.
      </P>

      <H2>9. Modification des CGV</H2>
      <P>
        L'éditeur peut modifier les CGV à tout moment. La version applicable est celle
        en ligne à la date d'utilisation du Service&nbsp;; pour les abonnements en
        cours, les modifications tarifaires ne s'appliquent qu'à la prochaine
        échéance, après information préalable d'au moins 30 jours par courriel ou par
        l'interface.
      </P>

      <H2>10. Droit applicable et litiges</H2>
      <P>
        Les CGV sont régies par le droit français. En cas de différend, une solution
        amiable sera recherchée en priorité par écrit. Le consommateur peut
        également recourir gratuitement à un médiateur de la consommation&nbsp;:{" "}
        <Fill t="organisme de médiation retenu et son adresse" />, et saisir la
        plateforme européenne de règlement en ligne des litiges. À défaut d'accord,
        les tribunaux français sont compétents&nbsp;; pour les professionnels, le
        tribunal de <Fill t="ville du tribunal compétent" /> est seul compétent.
      </P>
    </article>
  );
}
