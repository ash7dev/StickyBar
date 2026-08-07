'use client';

import Link from 'next/link';
import {
  AlertCircle, ArrowRight, Camera, CheckCircle2, ChevronDown, FileText,
  Info, KeyRound, MessageCircle, Scale, Tag, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   PARTI PRIS DE CETTE PAGE

   Le reflexe habituel serait une grille de cartes renvoyant vers des articles
   de blog. Avec trois contenus reels, ca donne neuf cartes « bientot
   disponible » — ce qui signale l'abandon, pas la richesse.

   Ici les guides sont DEPLIABLES SUR LA PAGE. Le contenu existe des la mise
   en ligne, aucun lien ne mene dans le vide, et l'ensemble reste indexable
   par les moteurs de recherche puisque le texte est dans le HTML.

   Quand un guide devient trop long pour un accordeon, il migre vers sa propre
   page. Pas avant.
   ═══════════════════════════════════════════════════════════════════════════ */

const CONTACT = {
  whatsapp: '221770000000',
  whatsappLabel: '+221 77 000 00 00',
};

/* -- Guide photo ---------------------------------------------------------- */

const PHOTO_TIPS = [
  {
    title: 'Photographiez en plein jour, rideaux ouverts',
    body: 'La lumière naturelle est le seul élément que vous ne pouvez pas rattraper ensuite. Entre 9h et 11h, ou 16h et 18h : le soleil au zénith écrase les volumes. Allumez aussi les lampes, même en journée — ça réchauffe la pièce.',
  },
  {
    title: 'Rangez avant, pas après',
    body: 'Pas d’effets personnels visibles, pas de linge, pas de produits d’entretien, abattant des toilettes fermé. Un voyageur qui voit vos affaires ne se projette pas dans le logement.',
  },
  {
    title: 'Cadrez à hauteur de poitrine, depuis un angle',
    body: 'En format paysage, depuis un coin de la pièce : c’est ce qui donne le plus de volume. Évitez le grand-angle extrême, qui déforme et crée un écart avec la réalité — donc un motif de remboursement à l’arrivée.',
  },
  {
    title: 'Montrez aussi ce qui n’est pas flatteur',
    body: 'Cuisine, salle d’eau, parking, groupe électrogène, compteur. Les voyageurs cherchent ces photos et se méfient de leur absence. Une annonce sans photo de salle de bain reçoit moins de demandes qu’une annonce avec une salle de bain modeste.',
  },
  {
    title: 'Une photo par pièce, au minimum',
    body: 'Plus l’entrée, la vue depuis la fenêtre principale, et l’extérieur du bâtiment. Un voyageur qui reconnaît la façade à son arrivée est déjà rassuré.',
  },
  {
    title: 'Aucun filtre, aucune retouche de couleur',
    body: 'Un mur qui paraît blanc sur la photo et beige en vrai est un écart de conformité. Notre agent compare les photos au logement lors de la visite : celles qui ne correspondent pas sont refusées.',
  },
] as const;

/* -- Guide prix ----------------------------------------------------------- */

const PRICING_STEPS = [
  {
    title: 'Comparez trois biens équivalents',
    body: 'Même quartier, même type, même capacité. Filtrez sur Klef par ville et par nombre de personnes : vous verrez la fourchette réelle du marché, pas une estimation.',
  },
  {
    title: 'Démarrez 10 à 15 % sous la fourchette',
    body: 'Vos premières réservations servent à obtenir vos premiers avis. Un logement sans avis se loue mal, quel que soit son prix. Une fois trois ou quatre séjours accomplis, remontez au niveau du marché.',
  },
  {
    title: 'Ajoutez des tarifs dégressifs',
    body: 'Un tarif réduit à partir de 7 nuits, puis de 30, remplit vos périodes creuses. Un séjour long vaut mieux que trois courts : moins de ménage, moins de remise de clés, moins de risque.',
  },
  {
    title: 'Raisonnez en revenu net',
    body: 'Le montant que vous recevez apparaît sur chaque réservation dans votre tableau de bord, commission déduite. Fixez votre prix à partir de ce net, pas du tarif affiché.',
  },
] as const;

/* -- Checklist arrivée ---------------------------------------------------- */

const CHECKLIST = [
  'Deux jeux de clés, dont un de secours accessible',
  'Code wifi écrit et affiché dans le logement',
  'Eau et électricité vérifiées le matin même',
  'Groupe électrogène en état, réservoir plein',
  'Draps et serviettes propres, en nombre suffisant',
  'Papier toilette, savon, sac poubelle : les basiques',
  'Un numéro joignable pendant tout le séjour',
  'Instructions d’accès envoyées la veille',
] as const;

export default function RessourcesPage() {
  return (
    <div className="bg-canvas min-h-dvh">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="-mt-20 bg-[radial-gradient(70%_60%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] pb-16 pt-32 text-white sm:pt-36">
        <div className="mx-auto max-w-[1120px] px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.06] px-4 py-1.5">
            <FileText className="h-3.5 w-3.5 text-on-inverse-marker" aria-hidden="true" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-forest-200">
              Ressources propriétaires
            </span>
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-neutral-50">
            Louer mieux, pas seulement louer<span className="text-on-inverse-marker">.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-200 sm:text-lg">
            Ce qui fait la différence entre une annonce qui dort et une annonce
            qui se réserve. Concret, testé sur le marché sénégalais.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] space-y-16 px-6 py-12 lg:py-16">

        {/* ── Guide photo ───────────────────────────────────────────────── */}
        <section className="space-y-6">
          <header className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-marker-bg text-forest-800">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-forest-900">
                Réussir vos photos
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-foreground-muted">
                C’est le levier le plus rentable de votre annonce, et le seul qui
                ne coûte rien. Six règles, applicables avec un téléphone.
              </p>
            </div>
          </header>

          {/*
            details/summary natifs : le contenu est dans le HTML donc indexable,
            l'ouverture fonctionne avant hydratation, le clavier et les lecteurs
            d'ecran sont geres par le navigateur, et Ctrl+F trouve le texte des
            reponses fermees.
          */}
          <ol className="divide-y divide-border overflow-hidden rounded-card border border-border bg-background-card">
            {PHOTO_TIPS.map(({ title, body }, i) => (
              <li key={title}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-5 text-left transition-colors duration-150 hover:bg-background-alt [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-sm tabular-nums text-forest-500" aria-hidden="true">
                      0{i + 1}
                    </span>
                    <span className="flex-1 font-medium text-forest-900">{title}</span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-5 pb-5 pl-14 text-sm leading-relaxed text-foreground-muted">
                    {body}
                  </p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Guide prix ────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <header className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
              <Tag className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-forest-900">
                Fixer votre prix
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-foreground-muted">
                Une méthode, pas un montant. Le bon prix dépend de votre
                quartier, de votre capacité et de la saison.
              </p>
            </div>
          </header>

          <ol className="grid gap-4 sm:grid-cols-2">
            {PRICING_STEPS.map(({ title, body }, i) => (
              <li key={title} className="rounded-card border border-border bg-background-card p-5 shadow-sm">
                <span className="font-mono text-sm tabular-nums text-forest-500" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="mt-2 font-display text-base font-semibold leading-snug tracking-[-0.01em] text-forest-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Checklist arrivée ─────────────────────────────────────────── */}
        <section className="rounded-card border border-border bg-background-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
                Avant chaque arrivée
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Huit points. Le voyageur confirme la remise des clés depuis
                l’application — c’est ce geste qui déclenche votre versement,
                donc autant qu’il se passe bien.
              </p>

              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Obligations ──────────────────────────────────────────────── */}
        {/*
          ⚠️  BLOC A FAIRE VALIDER PAR UN PROFESSIONNEL AVANT PUBLICATION.

          La fiscalite des revenus locatifs et les obligations declaratives au
          Senegal dependent du statut du proprietaire, du regime choisi et de
          la nature de la location. Je ne peux pas les enoncer a sa place, et
          une information fiscale erronee sur une page publique engage la
          plateforme autant que le proprietaire.

          Le bloc dit donc ce qui est vrai — que ces obligations existent et
          qu'elles dependent de chaque situation — et renvoie vers un conseil
          qualifie. C'est plus utile qu'un tableau inexact, et plus honnete
          qu'un silence.
        */}
        <section className="rounded-card border border-warning-500/30 bg-warning-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-warning-500/15 text-warning-700">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
                Vos obligations fiscales et déclaratives
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                Les revenus tirés d’une location meublée sont imposables au
                Sénégal. Le régime applicable, les seuils et les déclarations
                dépendent de votre statut — particulier ou société — et du
                volume de votre activité.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                Klef ne se substitue pas à vos obligations déclaratives et ne
                prélève aucun impôt à votre place. Nous vous fournissons le
                relevé de vos encaissements, exportable depuis votre tableau de
                bord, pour que vous ou votre comptable puissiez l’utiliser.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                Avant de vous lancer, faites confirmer votre situation par un
                comptable ou un conseil fiscal. Nous pouvons vous orienter vers
                des professionnels à Dakar si vous n’en avez pas.
              </p>
            </div>
          </div>
        </section>

        {/* ── Aide directe ─────────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-card border border-border bg-background-card p-6 shadow-sm">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-forest-700">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
              Un agent passe chez vous
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
              La visite de vérification est obligatoire avant publication. Elle
              est aussi l’occasion de faire les photos correctement et de fixer
              le prix ensemble, sur place.
            </p>
            <Link
              href="/devenir-hote"
              className="mt-5 inline-flex items-center gap-2 self-start rounded-pill border border-border px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
            >
              Demander une visite
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex flex-col rounded-card border border-border bg-background-card p-6 shadow-sm">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-forest-700">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
              Une question précise
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
              Écrivez-nous sur WhatsApp. C’est le plus rapide, et vous parlez à
              quelqu’un qui connaît votre dossier.
            </p>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 self-start rounded-pill border border-border px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {CONTACT.whatsappLabel}
            </a>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="rounded-card bg-[radial-gradient(70%_55%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] p-8 text-center text-white sm:p-12">
          <h2 className="mx-auto max-w-xl font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-neutral-50">
            Votre logement est prêt&nbsp;?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-forest-200">
            La publication est gratuite. Vous ne payez qu’au moment où vous êtes
            payé.
          </p>
          <Link
            href="/publier"
            className="mt-8 inline-flex items-center gap-2 rounded-pill bg-action px-7 py-3.5 text-base font-semibold text-on-action transition-colors duration-150 hover:bg-action-hover"
          >
            Publier mon logement
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-xs text-forest-200/70">
            Voir aussi{' '}
            <Link href="/paiement" className="underline underline-offset-2 hover:text-on-inverse-marker">
              quand et comment vous êtes payé
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
