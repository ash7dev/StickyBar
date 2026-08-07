'use client';

import Link from 'next/link';
import { ArrowRight, Key, Search, ShieldCheck, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/*
  Contenu revu.

  Trois affirmations n'etaient adossees a rien :
    - « des centaines de logements verifies » alors qu'il y en aura une
      vingtaine au lancement ;
    - « hotes verifies et disponibles 24/7 » ;
    - « assurance incluse », qui est une allegation contractuelle.

  Elles sont remplacees par ce que le produit fait reellement : la visite
  par un agent et le sequestre. C'est plus fort, et c'est vrai.
*/

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Trouvez votre logement',
    description: 'Chaque bien publié a été visité et photographié par un agent Klef.',
    key: false,
  },
  {
    number: '02',
    icon: Wallet,
    title: 'Réservez et payez',
    description: 'Par Wave ou Orange Money. Le montant part de votre compte mais n’est pas versé.',
    key: false,
  },
  {
    number: '03',
    icon: Key,
    title: 'Recevez les clés',
    description: 'Vous confirmez votre entrée depuis l’application. C’est vous qui déclenchez la suite.',
    key: true,
  },
  {
    number: '04',
    icon: ShieldCheck,
    title: 'Klef verse l’hôte',
    description: 'Le séquestre est libéré. Si le logement ne correspond pas, vous êtes remboursé.',
    key: false,
  },
] as const;

export function HowItWorksSection() {
  return (
    /*
      Les neuf animations infinies d'arriere-plan sont supprimees : cercles
      flous en blur-3xl, formes en rotation, lignes en degrade, le tout en
      boucle sans fin et sans garde prefers-reduced-motion. Le degrade du
      canvas suffit a habiller la section.
    */
    <section className="bg-canvas py-16 sm:py-24">
      <div className="mx-auto max-w-[1120px] px-6">

        <header className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/60 bg-white/55 px-4 py-2 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-forest-700" aria-hidden="true" />
            <span className="text-[0.8125rem] text-neutral-700">Paiement sous séquestre</span>
          </span>

          <h2 className="mt-6 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-forest-900">
            Comment ça marche.
          </h2>

          <p className="mt-4 text-base leading-relaxed text-foreground-muted">
            Quatre étapes, et votre argent ne bouge qu’au moment où vous le décidez.
          </p>
        </header>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ number, icon: Icon, title, description, key: isKey }) => (
            <li
              key={number}
              className={cn(
                'flex flex-col rounded-card p-5 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none',
                isKey
                  ? 'bg-[linear-gradient(180deg,#072A20_0%,#041912_100%)] shadow-lg'
                  : 'border border-white/60 bg-white/55 shadow-[0_2px_20px_rgba(11,61,46,0.05)] backdrop-blur-md hover:shadow-md',
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-inner',
                  isKey
                    ? 'border border-lime-400/20 bg-lime-400/15 text-lime-400'
                    : 'bg-forest-100 text-forest-800',
                )}>
                  <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                </span>
                {/* La pastille numerotee etait un cercle en degrade lime -> forest
                    pose en dehors de la carte, sur les quatre etapes. Le numero
                    est une donnee de sequence, pas un badge. */}
                <span className={cn(
                  'font-mono text-xs tabular-nums',
                  isKey ? 'text-forest-200' : 'text-foreground-faint',
                )}>
                  {number}
                </span>
              </div>

              <h3 className={cn(
                'font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em]',
                isKey ? 'text-neutral-50' : 'text-forest-900',
              )}>
                {title}
              </h3>

              <p className={cn(
                'mt-2 text-sm leading-relaxed',
                isKey ? 'text-forest-200' : 'text-foreground-muted',
              )}>
                {description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          {/* <a href> sur une route interne provoquait un rechargement complet
              de la page. */}
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 rounded-pill border border-[rgba(122,158,26,0.30)] bg-lime-400 px-7 py-3.5 text-base font-semibold text-forest-800 shadow-[0_6px_20px_rgba(155,194,44,0.30)] transition-colors duration-150 hover:bg-lime-300"
          >
            Voir les logements vérifiés
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-xs text-foreground-faint">
            Aucun frais tant que vous n’avez pas les clés.
          </p>
        </div>
      </div>
    </section>
  );
}