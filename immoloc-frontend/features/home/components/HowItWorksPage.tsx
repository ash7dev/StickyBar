'use client';

import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, Calendar, CheckCircle2, CreditCard,
  Key, Search, ShieldCheck, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ---------------------------------------------------------------------------
   Formulation du sequestre unifiee.

   Le fichier decrivait le meme mecanisme de deux facons contradictoires :
   « conserve en sequestre jusqu'a votre arrivee » (etape 03 locataire et
   garanties) et « apres le check-in du locataire » (etape 04 proprietaire).
   Le reste du produit dit « a la remise des cles ». Une seule version.
   --------------------------------------------------------------------------- */

const STEPS_LOCATAIRE = [
  {
    icon: Search,
    title: 'Recherchez votre logement',
    description: 'Parcourez des biens vérifiés partout au Sénégal. Filtrez par ville, type, prix et équipements.',
  },
  {
    icon: Calendar,
    title: 'Choisissez vos dates',
    description: 'Le calendrier est mis à jour en temps réel. Les dates déjà réservées sont bloquées automatiquement.',
  },
  {
    icon: CreditCard,
    title: 'Réservez et payez',
    description: 'Par Wave ou Orange Money. Le montant quitte votre compte mais reste bloqué par Klef.',
  },
  {
    icon: Key,
    title: 'Recevez les clés',
    description: 'Vous confirmez votre entrée depuis l’application. C’est ce geste qui libère le paiement.',
  },
] as const;

const STEPS_PROPRIETAIRE = [
  {
    icon: Users,
    title: 'Créez votre annonce',
    description: 'Photos, description, équipements et tarifs. Chaque annonce est contrôlée avant publication.',
  },
  {
    icon: Calendar,
    title: 'Gérez vos disponibilités',
    description: 'Bloquez les dates indisponibles et ajustez vos tarifs par saison. Aucune double réservation possible.',
  },
  {
    icon: CheckCircle2,
    title: 'Recevez des demandes',
    description: 'Acceptez ou refusez chaque réservation. Vous gardez la main sur qui séjourne chez vous.',
  },
  {
    icon: CreditCard,
    title: 'Encaissez',
    description: 'Le versement part dès que le locataire confirme la remise des clés. Aucun impayé possible.',
  },
] as const;

const GARANTIES = [
  {
    icon: ShieldCheck,
    title: 'Paiement sous séquestre',
    description: 'Les fonds sont conservés par Klef et versés à l’hôte après la remise des clés. Si le logement ne correspond pas, le voyageur est remboursé.',
  },
  {
    icon: BadgeCheck,
    title: 'Identités vérifiées',
    description: 'Locataires et propriétaires fournissent une pièce d’identité contrôlée avant toute réservation.',
  },
  {
    icon: Search,
    title: 'Annonces visitées',
    description: 'Un agent Klef se déplace, photographie le logement et vérifie l’adresse avant la mise en ligne.',
  },
  {
    icon: Users,
    title: 'Une équipe joignable',
    // « Support client Klef 7j/7 » retire : engagement de disponibilite
    // sans equipe dimensionnee pour le tenir au lancement.
    description: 'Un interlocuteur pour vous accompagner avant, pendant et après le séjour, par WhatsApp ou téléphone.',
  },
] as const;

export function HowItWorksPage() {
  return (
    // min-h-screen ignore la barre d'adresse mobile : dvh la prend en compte.
    <div className="bg-canvas min-h-dvh">

      {/* -- Hero ---------------------------------------------------------- */}
      {/*
        Le -mt-20 compense la hauteur reservee a la navbar flottante par le
        layout. C'est fragile : la valeur est dupliquee ici et la, et toute
        modification de la navbar casse l'alignement en silence.
        A remonter dans un token --nav-offset consomme aux deux endroits.

        Le degrade partait de forest-950 pour y revenir via #072A20 — soit
        forest-900, ecrit en hexadecimal brut alors que le token existe.
        Remplace par le halo radial du systeme.
      */}
      <section className="-mt-20 bg-[radial-gradient(70%_60%_at_50%_0%,var(--forest-700)_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] pb-16 pt-32 text-white sm:pt-36 lg:pb-20">
        <div className="mx-auto max-w-[1120px] px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.06] px-4 py-1.5">
            {/* Le point clignotait en boucle a cote du libelle. */}
            <ShieldCheck className="h-3.5 w-3.5 text-on-inverse-marker" aria-hidden="true" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-forest-200">
              Guide complet
            </span>
          </span>

          {/* font-extrabold vaut 800 : au-dela de 600, Fraunces ferme ses
              contreformes et perd sa lisibilite. */}
          <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-neutral-50">
            Comment ça marche<span className="text-on-inverse-marker">.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-200 sm:text-lg">
            Comment Klef sécurise la location de logements au Sénégal, que vous
            soyez locataire ou propriétaire.
          </p>
        </div>
      </section>

      {/* max-w-5xl pour le hero, max-w-6xl pour le contenu : deux largeurs
          differentes sur la meme page, et aucune ne correspond au token. */}
      <div className="mx-auto max-w-[1120px] space-y-16 px-6 py-12 lg:py-16">

        {/* -- Locataires ------------------------------------------------- */}
        <section className="space-y-8">
          <header className="space-y-3 text-center">
            {/* text-lime-600 sur bg-lime-100 donnait 1,88:1 — le libelle
                etait invisible. forest-800 sur lime-100 donne 11:1. */}
            <span className="inline-block rounded-pill bg-lime-100 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-forest-800">
              Espace locataire
            </span>
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Pour les locataires
            </h2>
            <p className="mx-auto max-w-lg text-sm text-foreground-muted">
              Trouver et réserver un hébergement, en quatre étapes.
            </p>
          </header>

          {/* <ol> : la sequence etait rendue en <div> avec des numeros
              decoratifs. L'ordre est une information, il appartient au
              balisage. */}
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS_LOCATAIRE.map(({ icon: Icon, title, description }, i) => (
              <li
                key={title}
                className="flex flex-col rounded-card border border-border bg-background-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  {/* Le squircle etait en forest-950 a icone lime : huit
                      blocs sombres sur la page, entre les etapes et les
                      garanties. Neutre suffit sur fond clair. */}
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                  </span>
                  {/* text-forest-900/30 donnait 1,89:1 : le numero n'etait
                      pas lisible. En mono forest-500 : 4,9:1. */}
                  <span className="font-mono text-sm tabular-nums text-forest-500" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>

                <h3 className="font-display text-base font-semibold leading-snug tracking-[-0.01em] text-forest-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {description}
                </p>
              </li>
            ))}
          </ol>

          <div className="text-center">
            {/* /logements est la racine des pages de detail, pas l'index de
                recherche. Le reste du produit utilise /explorer. */}
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-pill border border-action-edge bg-action px-7 py-3.5 text-base font-semibold text-on-action shadow-action transition-colors duration-150 hover:bg-action-hover"
            >
              Parcourir les logements
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* -- Propriétaires ---------------------------------------------- */}
        {/* Une seule surface sombre dans le corps de page, et elle marque une
            bascule d'audience. Les trois orbes floutes en blur-3xl sont
            remplaces par le halo radial. */}
        <section className="space-y-8 rounded-card bg-[radial-gradient(70%_55%_at_50%_0%,var(--forest-700)_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] p-6 text-white sm:p-10">
          <header className="space-y-3 text-center">
            <span className="inline-block rounded-pill border border-white/10 bg-white/[0.06] px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-forest-200">
              Espace propriétaire
            </span>
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-neutral-50">
              Pour les propriétaires
            </h2>
            <p className="mx-auto max-w-lg text-sm text-forest-200">
              Louer votre bien sans courir après le paiement.
            </p>
          </header>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS_PROPRIETAIRE.map(({ icon: Icon, title, description }, i) => (
              <li
                key={title}
                // bg-forest-900/70 sur un fond forest-950 : les cartes etaient
                // plus sombres que leur support. Sur du sombre, une surface
                // se signale par la lumiere.
                className="flex flex-col rounded-inner border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-white/[0.07] text-forest-200">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-sm tabular-nums text-forest-300" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>

                <h3 className="font-display text-base font-semibold leading-snug tracking-[-0.01em] text-neutral-50">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-200">
                  {description}
                </p>
              </li>
            ))}
          </ol>

          <div className="text-center">
            <Link
              href="/devenir-hote"
              className="inline-flex items-center gap-2 rounded-pill bg-action px-7 py-3.5 text-base font-semibold text-on-action transition-colors duration-150 hover:bg-action-hover"
            >
              Devenir hôte
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* -- Garanties -------------------------------------------------- */}
        <section className="space-y-8">
          <header className="space-y-3 text-center">
            <h2 className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold tracking-[-0.02em] text-forest-900">
              Ce que Klef garantit
            </h2>
            <p className="mx-auto max-w-lg text-sm text-foreground-muted">
              Quatre engagements, vérifiables à chaque réservation.
            </p>
          </header>

          <ul className="grid gap-4 md:grid-cols-2">
            {GARANTIES.map(({ icon: Icon, title, description }, i) => (
              <li
                key={title}
                className={cn(
                  'flex items-start gap-4 rounded-card border p-5 transition-shadow duration-200',
                  // Une seule garantie est mise en avant : le sequestre, qui
                  // est le mecanisme dont tout le reste decoule.
                  i === 0
                    ? 'border-action/40 bg-lime-50'
                    : 'border-border bg-background-card shadow-sm hover:shadow-md',
                )}
              >
                <span className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-inner',
                  i === 0 ? 'bg-marker-bg text-forest-800' : 'bg-neutral-100 text-forest-700',
                )}>
                  <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-forest-900">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}