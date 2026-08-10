'use client';

import { useMemo } from 'react';
import { Check, TrendingUp, Key, Award, Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TerangaAccountData } from '@/lib/nestjs';
import { useAutoScrollCarousel } from '../hooks/use-auto-scroll-carousel';

interface Props {
  data: TerangaAccountData | null;
  isAuthenticated: boolean;
}

/* ⚠️ Seuils codés en dur dans le front : un changement de barème côté backend
   ne se répercutera pas ici, et ce composant annonce déjà 250 000 FCFA pour
   l'Argent là où `TerangaRewardModal` annonce 300 000. À faire descendre de
   l'API pour qu'il n'existe qu'une source. */
const STEPS = [
  {
    tier: 'BRONZE',
    label: 'Clé de Bronze',
    icon: Key,
    cashback: 1.5,
    reqText: 'Dès la création du compte',
    minGmv: 0,
    minSejours: 0,
  },
  {
    tier: 'SILVER',
    label: 'Clé d’Argent',
    icon: Award,
    cashback: 2,
    reqText: '300 000 FCFA ou 3 séjours',
    minGmv: 300_000,
    minSejours: 3,
  },
  {
    tier: 'GOLD',
    label: 'Clé d’Or',
    icon: Crown,
    cashback: 3,
    reqText: '1 000 000 FCFA ou 8 séjours',
    minGmv: 1_000_000,
    minSejours: 8,
  },
] as const;

const ORDRE: Record<string, number> = { BRONZE: 0, SILVER: 1, GOLD: 2 };

const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const pct = (n: number) => `${n.toFixed(1).replace('.', ',').replace(',0', '')} %`;

export function TerangaTierProgressCard({ data, isAuthenticated }: Props) {
  const currentTier = data?.tier ?? 'BRONZE';
  const gmv = Number(data?.gmv12Mois) || 0;
  const sejours = Number(data?.nbSejours) || 0;

  const { containerRef, bindAutoScroll } = useAutoScrollCarousel<HTMLDivElement>({
    intervalMs: 4000,
    itemCount: 3,
  });

  /* La chaîne de `if/else if` recalculait à la main l'état de chaque palier,
     avec une branche dédiée par tier. Une comparaison d'ordre suffit — et
     ça évite qu'un quatrième palier oblige à réécrire la logique. */
  const steps = useMemo(() => {
    const rang = ORDRE[currentTier] ?? 0;

    return STEPS.map((step, idx) => {
      const rangStep = ORDRE[step.tier];
      const unlocked = rangStep <= rang;
      const current = rangStep === rang;
      /* L'ancienne version ne calculait la progression que pour le palier
         immédiatement suivant : un membre Bronze voyait 0 % sur l'Or, sans
         distinction avec un palier hors de portée. */
      const next = rangStep === rang + 1;

      let progression = 0;
      if (unlocked) progression = 100;
      else if (next && isAuthenticated) {
        progression = Math.round(Math.min(100, Math.max(
          step.minGmv > 0 ? (gmv / step.minGmv) * 100 : 0,
          step.minSejours > 0 ? (sejours / step.minSejours) * 100 : 0,
        )));
      }

      /* Le reste à parcourir motive davantage qu'un pourcentage. */
      const resteSejours = Math.max(0, step.minSejours - sejours);
      const resteGmv = Math.max(0, step.minGmv - gmv);

      return { ...step, idx, unlocked, current, next, progression, resteSejours, resteGmv };
    });
  }, [currentTier, gmv, sejours, isAuthenticated]);

  return (
    <section className="card space-y-6 p-5 sm:p-8">

      <header className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Vos paliers
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {isAuthenticated
                ? 'Votre progression vers le palier suivant.'
                : 'Trois paliers, un taux de cashback qui augmente.'}
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex shrink-0 items-center gap-2 self-start rounded-pill border border-border bg-background-alt px-3 py-1 text-xs font-semibold text-foreground-muted sm:self-auto">
            <span className="tabular-nums">{sejours}</span> séjour{sejours > 1 ? 's' : ''}
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{nombre(gmv)} FCFA</span>
          </div>
        )}
      </header>

      <div
        ref={containerRef}
        {...bindAutoScroll}
        role="list"
        aria-label="Paliers du Teranga Club"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0"
      >
        {steps.map(({
          tier, label, icon: Icon, cashback, reqText, idx,
          unlocked, current, next, progression, resteSejours, resteGmv,
        }) => (
          <div
            key={tier}
            role="listitem"
            aria-current={current ? 'step' : undefined}
            className={cn(
              'flex w-[85vw] shrink-0 snap-center flex-col justify-between gap-4 rounded-card border p-5 sm:w-auto',
              current
                ? 'border-gold-300 bg-gold-50'
                : unlocked
                  ? 'border-gold-200 bg-gold-50/40'
                  : 'border-border bg-background-card',
            )}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  {/* Les emojis 🗝️ 🔑 👑 : rendu variable selon la plateforme,
                     annoncés littéralement par les lecteurs d'écran, et deux
                     d'entre eux se ressemblent au point d'être confondus. */}
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border',
                    unlocked
                      ? 'border-gold-200 bg-gold-400 text-forest-900'
                      : 'border-border bg-background-alt text-foreground-muted',
                  )}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground">{label}</h3>
                    <p className="text-xs font-semibold tabular-nums text-gold-700">
                      {pct(cashback)} de cashback
                    </p>
                  </div>
                </div>

                {unlocked ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-gold-400 text-forest-900">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Palier atteint</span>
                  </span>
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">Palier verrouillé</span>
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-foreground-muted">
                {reqText}
              </p>
            </div>

            {/* Un visiteur non connecté voyait « Progression 0 % » sur les
               trois cartes, comme s'il s'agissait de son parcours. */}
            {isAuthenticated && (unlocked || next) && (
              <div className="space-y-1.5 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground-muted">
                    {unlocked ? 'Palier atteint' : 'Progression'}
                  </span>
                  {!unlocked && (
                    <span className="font-semibold tabular-nums text-foreground">
                      {progression} %
                    </span>
                  )}
                </div>

                {!unlocked && (
                  <>
                    <div
                      role="img"
                      aria-label={`Progression vers ${label} : ${progression} pour cent`}
                      className="h-2 w-full overflow-hidden rounded-pill bg-background-alt"
                    >
                      <div
                        className="h-full rounded-pill bg-gold-400 transition-[width] duration-500"
                        style={{ width: `${progression}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground-muted">
                      Encore{' '}
                      <span className="font-semibold tabular-nums text-foreground">
                        {resteSejours}
                      </span>{' '}
                      séjour{resteSejours > 1 ? 's' : ''} ou{' '}
                      <span className="font-semibold tabular-nums text-foreground">
                        {nombre(resteGmv)} FCFA
                      </span>
                    </p>
                  </>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <p className="border-t border-border pt-3 text-xs text-foreground-muted">
                Palier {idx + 1} sur 3
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}