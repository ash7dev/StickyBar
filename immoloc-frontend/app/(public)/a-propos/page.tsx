'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Eye, KeyRound, MessageCircle, ScanFace, ShieldOff,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ⚠️  SECTION « NOTRE HISTOIRE » : TROIS PHRASES A REECRIRE

   Les emplacements marques FOUNDER_* sont les seuls contenus de tout ce
   projet que personne ne peut ecrire a ta place. Ce sont aussi les plus
   rentables de la page.

   Ce qui marche, et pourquoi :

   - Un nom et un visage. Ton produit resout un probleme d'anonymat ; une
     page « A propos » anonyme demande a l'utilisateur de remplacer un
     inconnu par un autre inconnu.

   - Un fait concret, pas une mission. « Une proche a perdu 300 000 F sur un
     appartement qui n'existait pas » vaut mieux que « nous voulons
     revolutionner l'immobilier ». Le premier se retient, le second se lit
     partout.

   - Le reflexe de fondateur solo est de paraitre plus gros qu'on est. Ici
     c'est l'inverse qui sert : une personne identifiable a Dakar est plus
     rassurante qu'une « equipe » vague.
   ═══════════════════════════════════════════════════════════════════════════ */

const FOUNDER = {
  name: '[Prénom Nom]',
  role: 'Fondateur',
  /** Photo réelle. Un portrait de banque d'images se repère et détruit l'effet. */
  photo: '',
  /** Une phrase : qui tu es, ce que tu faisais avant. */
  intro: '[Développeur à Dakar, j’ai passé les dernières années à construire des produits web pour des entreprises sénégalaises.]',
  /** Le déclencheur, en une ou deux phrases factuelles. */
  trigger: '[En 2025, une personne de mon entourage a versé une avance pour un appartement à Dakar. Le logement n’existait pas, et le démarcheur avait disparu. Elle n’a eu aucun recours.]',
  /** Ce que tu as décidé de faire, concrètement. */
  decision: '[J’ai commencé à écrire Klef le mois suivant, avec une seule idée : que l’argent ne quitte jamais les mains de la plateforme avant que le locataire ait les clés.]',
};

const LAUNCH = {
  /** Un petit chiffre vrai est plus crédible qu'un grand chiffre flou. */
  year: '2026',
  listings: '—',
  cities: 'Dakar et Saly',
};

/*
  Valeurs formulees comme des engagements verifiables.

  « Transparence, innovation, excellence » ne dit rien et ne s'oppose a rien :
  aucune entreprise ne revendique l'opacite. Une valeur utile est une phrase
  qu'on peut confronter au produit et prendre en defaut.
*/
const VALUES = [
  {
    icon: Eye,
    title: 'On ne publie pas un bien qu’on n’a pas vu',
    body: 'Un agent Klef se déplace, photographie chaque pièce et vérifie l’adresse avant la mise en ligne. Aucune annonce n’est publiée sur la seule base de photos envoyées par le propriétaire.',
    check: 'Vérifiable : chaque annonce publiée porte la mention de sa visite.',
  },
  {
    icon: KeyRound,
    title: 'Votre argent ne bouge pas avant vous',
    body: 'Le paiement est bloqué dès la réservation et n’est versé au propriétaire qu’après votre confirmation de la remise des clés. C’est vous, et personne d’autre, qui déclenchez le versement.',
    check: 'Vérifiable : le mécanisme est décrit étape par étape sur la page Séquestre.',
  },
  {
    icon: ShieldOff,
    title: 'On dit aussi ce qu’on ne couvre pas',
    body: 'Notre protection a des limites, et elles sont écrites. Nous ne promettons ni assurance santé, ni couverture de vos effets personnels, ni disponibilité permanente que nous ne pourrions pas tenir.',
    check: 'Vérifiable : la liste des exclusions est publique, pas enfouie dans les CGU.',
  },
  {
    icon: MessageCircle,
    title: 'On répond, surtout quand ça se passe mal',
    body: 'Un numéro joignable, un interlocuteur qui connaît votre dossier, et une décision écrite et motivée en cas de litige. Pas de formulaire sans réponse.',
    check: 'Vérifiable : le numéro est sur chaque page, et il aboutit.',
  },
] as const;

export default function AProposPage() {
  return (
    <div className="bg-canvas min-h-dvh">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="-mt-20 bg-[radial-gradient(70%_60%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] pb-16 pt-32 text-white sm:pt-36">
        <div className="mx-auto max-w-[1120px] px-6 text-center">
          <h1 className="mx-auto max-w-3xl font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-neutral-50">
            À propos de Klef<span className="text-on-inverse-marker">.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-200 sm:text-lg">
            Une plateforme de location de logements au Sénégal, construite autour
            d’une seule idée&nbsp;: personne ne devrait payer d’avance à un
            inconnu.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] space-y-16 px-6 py-12 lg:py-20">

        {/* ── Ce que fait Klef ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-2xl">
          <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-forest-900">
            Ce que fait Klef
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground-muted">
            <p>
              Klef met en relation des propriétaires et des voyageurs pour des
              séjours de courte durée à {LAUNCH.cities}. Chaque logement est
              visité par un agent avant publication, et chaque paiement passe par
              un séquestre&nbsp;: les fonds sont conservés par Klef et versés au
              propriétaire seulement après la remise des clés.
            </p>
            <p>
              Ce n’est pas une fonctionnalité parmi d’autres. C’est le produit.
              Tout le reste — la recherche, le calendrier, les photos, le tableau
              de bord — existe pour que ce mécanisme fonctionne.
            </p>
          </div>
        </section>

        {/* ── Notre histoire ───────────────────────────────────────────── */}
        {/* Colonne de prose etroite plutot qu'une grille : le changement de
            rythme signale qu'on passe du produit a la personne. */}
        <section className="mx-auto max-w-2xl">
          <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-forest-900">
            Notre histoire
          </h2>

          <div className="mt-6 flex items-center gap-4 rounded-card border border-border bg-background-card p-5 shadow-sm">
            {FOUNDER.photo ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-pill">
                <Image src={FOUNDER.photo} alt="" fill sizes="64px" className="object-cover" />
              </div>
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-pill bg-forest-100 text-forest-700">
                <ScanFace className="h-6 w-6" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold tracking-[-0.01em] text-forest-900">
                {FOUNDER.name}
              </p>
              <p className="mt-0.5 text-sm text-foreground-muted">{FOUNDER.role}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground-muted">
            <p>{FOUNDER.intro}</p>
            <p>{FOUNDER.trigger}</p>
            <p>{FOUNDER.decision}</p>
            <p>
              Aujourd’hui, Klef est en ligne depuis {LAUNCH.year}, avec{' '}
              {LAUNCH.listings} logements vérifiés à {LAUNCH.cities}. C’est peu,
              et c’est volontaire&nbsp;: chaque bien passe par une visite, et une
              visite prend du temps.
            </p>
          </div>
        </section>

        {/* ── Nos valeurs ──────────────────────────────────────────────── */}
        <section className="space-y-8">
          <header className="mx-auto max-w-2xl">
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Nos valeurs
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground-muted">
              Quatre engagements, écrits de façon à pouvoir nous être opposés.
              Si l’un d’eux n’est pas tenu, dites-le-nous.
            </p>
          </header>

          <ul className="grid gap-4 md:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, body, check }, i) => (
              <li
                key={title}
                className={
                  i === 1
                    // Le sequestre est la valeur dont les trois autres
                    // decoulent : elle est mise en avant.
                    ? 'flex flex-col rounded-card border border-action/40 bg-lime-50 p-6'
                    : 'flex flex-col rounded-card border border-border bg-background-card p-6 shadow-sm'
                }
              >
                <span className={
                  i === 1
                    ? 'mb-4 grid h-11 w-11 place-items-center rounded-inner bg-marker-bg text-forest-800'
                    : 'mb-4 grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-forest-700'
                }>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>

                <h3 className="font-display text-base font-semibold leading-snug tracking-[-0.01em] text-forest-900">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
                  {body}
                </p>
                {/* La ligne de verification est ce qui distingue un engagement
                    d'une declaration d'intention. */}
                <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-forest-700">
                  {check}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="rounded-card bg-[radial-gradient(70%_55%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] p-8 text-center text-white sm:p-12">
          <h2 className="mx-auto max-w-xl font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-neutral-50">
            Vous savez qui nous sommes.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-forest-200">
            Le reste se juge à l’usage.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-pill bg-action px-7 py-3.5 text-base font-semibold text-on-action transition-colors duration-150 hover:bg-action-hover"
            >
              Voir les logements
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/devenir-hote"
              className="inline-flex items-center gap-2 rounded-pill border border-white/20 px-7 py-3.5 text-base font-medium text-neutral-50 transition-colors duration-150 hover:bg-white/10"
            >
              Devenir hôte
            </Link>
          </div>

          <p className="mt-6 text-xs text-forest-200/70">
            Une question directe&nbsp;?{' '}
            <Link href="/contact" className="underline underline-offset-2 hover:text-on-inverse-marker">
              Écrivez-nous
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
