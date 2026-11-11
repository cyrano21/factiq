import type { Metadata } from "next";
import {
  DocHeader,
  Fill,
  H2,
  LegalLink,
  LI,
  Notice,
  P,
  UL,
} from "@/components/legal/legal-doc";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du service Factiq : éditeur, directeur de publication, hébergeur et propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <article>
      <DocHeader
        tag="Informations légales"
        title="Mentions légales"
        intro="Informations relatives à l'éditeur du service Factiq, conformément aux articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)."
      />

      <Notice>
        Avant la mise en production publique, complétez chaque emplacement surligné en{" "}
        <span className="font-medium text-amber-200">ambre</span> avec les informations
        réelles de l'exploitant du service. La publication d'un site sans mentions légales
        complètes expose à un an d'emprisonnement et 75 000 € d'amende (art. 6-V LCEN).
      </Notice>

      <H2>1. Éditeur du site</H2>
      <P>
        Le site et le service Factiq (ci-après « le Service ») sont édités par{" "}
        <Fill t="dénomination sociale" /> (<Fill t="forme juridique" /> au capital de{" "}
        <Fill t="montant du capital" />), immatriculée au Registre du commerce et des
        sociétés sous le numéro <Fill t="numéro RCS ou SIREN" /> et dont le siège social
        est situé <Fill t="adresse complète du siège social" />.
      </P>
      <UL>
        <li>
          Numéro de TVA intracommunautaire&nbsp;: <Fill t="numéro de TVA intracom" />
        </li>
        <li>
          Numéro SIRET&nbsp;: <Fill t="numéro SIRET" />
        </li>
        <li>
          Directeur de la publication&nbsp;: <Fill t="nom du représentant légal" />
        </li>
        <li>
          Contact&nbsp;: <Fill t="e-mail de contact" /> — <Fill t="téléphone" />
        </li>
      </UL>

      <H2>2. Hébergement</H2>
      <P>
        Le Service est hébergé par <Fill t="nom de l'hébergeur (ex. OVHcloud, Vercel…)" />,
        établi <Fill t="adresse de l'hébergeur" />, joignable au{" "}
        <Fill t="téléphone de l'hébergeur" /> ou via <Fill t="site web de l'hébergeur" />.
      </P>

      <H2>3. Activité du service</H2>
      <P>
        Factiq est un outil logiciel d'aide à la facturation permettant aux indépendants
        et micro-entrepreneurs de produire des factures au format électronique,
        notamment des documents PDF comportant un XML Factur-X conforme à la norme EN
        16931. Factiq n'est pas une plateforme agréée (PDP) au sens de l'article 91 de
        la loi de finances pour 2024 et ne fournit aucun conseil comptable, fiscal ou
        juridique. L'utilisateur reste seul responsable de la conformité de ses
        factures à ses obligations fiscales et de leur transmission au moment voulu.
      </P>

      <H2>4. Propriété intellectuelle</H2>
      <P>
        L'ensemble des éléments composant le Service (marque, logotype, textes,
        interface, code source, base de données) est protégé par le droit de la
        propriété intellectuelle. Toute reproduction ou représentation, totale ou
        partielle, sans autorisation écrite préalable de l'éditeur est interdite. Les
        factures et données métier saisies par l'utilisateur demeurent la propriété
        exclusive de celui-ci&nbsp;; l'éditeur n'en acquiert aucun droit.
      </P>

      <H2>5. Signalement</H2>
      <P>
        Conformément à l'article 6-I-5° de la LCEN, toute personne peut signaler un
        contenu illicite hébergé sur le site en écrivant à <Fill t="e-mail de contact" />.
        L'éditeur s'engage à traiter tout signalement manifestement illicite dans les
        meilleurs délais.
      </P>

      <H2>6. Documents contractuels associés</H2>
      <P>
        L'utilisation du Service est encadrée par les{" "}
        <LegalLink href="/legal/cgv">conditions générales de vente</LegalLink> et le
        traitement des données personnelles est décrit dans la{" "}
        <LegalLink href="/legal/confidentialite">
          politique de confidentialité
        </LegalLink>
        .
      </P>
    </article>
  );
}
