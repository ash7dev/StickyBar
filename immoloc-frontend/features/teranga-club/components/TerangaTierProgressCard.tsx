'use client';

import { Check, TrendingUp } from 'lucide-react';
import type { TerangaAccountData } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { useAutoScrollCarousel } from '../hooks/use-auto-scroll-carousel';

interface Props {
  data: TerangaAccountData | null;
  isAuthenticated: boolean;
}

const STEPS = [
  {
    tier: 'BRONZE',
    label: 'Clé de Bronze',
    icon: '🗝️',
    cashback: '1.5%',
    reqText: 'Création du compte (0 FCFA)',
    minGmv: 0,
    minSejours: 0,
  },
  {
    tier: 'SILVER',
    label: 'Clé d’Argent',
    icon: '🔑',
    cashback: '2.0%',
    reqText: '250 000 FCFA ou 3 séjours',
    minGmv: 250000,
    minSejours: 3,
  },
  {
    tier: 'GOLD',
    label: 'Clé d’Or',
    icon: '👑',
    cashback: '3.0%',
    reqText: '1 000 000 FCFA ou 8 séjours',
    minGmv: 1000000,
    minSejours: 8,
  },
];

export function TerangaTierProgressCard({ data, isAuthenticated }: Props) {
  const currentTier = data?.tier ?? 'BRONZE';
  const currentGmv = data?.gmv12Mois ?? 0;
  const currentSejours = data?.nbSejours ?? 0;

  const isBronzeUnlocked = true;
  const isSilverUnlocked = currentTier === 'SILVER' || currentTier === 'GOLD';
  const isGoldUnlocked = currentTier === 'GOLD';

  const { containerRef, bindAutoScroll } = useAutoScrollCarousel<HTMLDivElement>({
    intervalMs: 4000,
    itemCount: 3,
  });

  return (
    <section className="card p-5 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="marker-box border border-forest-100 bg-forest-50 text-forest-700">
            <TrendingUp className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Votre Parcours & Qualification
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Suivez en direct votre progression vers le grade supérieur.
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-100 px-3 py-1 rounded-pill self-start sm:self-auto">
            <span>{currentSejours} séjour{currentSejours > 1 ? 's' : ''}</span>
            <span>•</span>
            <span className="tabular-nums">{currentGmv.toLocaleString('fr-FR')} FCFA dépensés</span>
          </div>
        )}
      </div>

      {/* Roadmap des 3 Paliers avec Auto-Scroll & Swipe mobile */}
      <div
        ref={containerRef}
        {...bindAutoScroll}
        className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar scroll-smooth"
      >
        {STEPS.map((step, idx) => {
          let isUnlocked = false;
          let isCurrent = false;

          if (step.tier === 'BRONZE') {
            isUnlocked = true;
            isCurrent = currentTier === 'BRONZE';
          } else if (step.tier === 'SILVER') {
            isUnlocked = isSilverUnlocked;
            isCurrent = currentTier === 'SILVER';
          } else if (step.tier === 'GOLD') {
            isUnlocked = isGoldUnlocked;
            isCurrent = currentTier === 'GOLD';
          }

          let stepProgressPct = 0;
          if (isUnlocked) {
            stepProgressPct = 100;
          } else if (step.tier === 'SILVER' && currentTier === 'BRONZE') {
            const pctGmv = Math.min(100, (currentGmv / 250000) * 100);
            const pctSejours = Math.min(100, (currentSejours / 3) * 100);
            stepProgressPct = Math.round(Math.max(pctGmv, pctSejours));
          } else if (step.tier === 'GOLD' && currentTier === 'SILVER') {
            const pctGmv = Math.min(100, (currentGmv / 1000000) * 100);
            const pctSejours = Math.min(100, (currentSejours / 8) * 100);
            stepProgressPct = Math.round(Math.max(pctGmv, pctSejours));
          }

          return (
            <div
              key={step.tier}
              className={cn(
                'snap-center shrink-0 w-[85vw] sm:w-auto rounded-card border p-5 space-y-4 relative flex flex-col justify-between transition-all',
                isCurrent
                  ? 'border-forest-500 bg-forest-50/50 shadow-sm ring-1 ring-forest-500'
                  : isUnlocked
                  ? 'border-forest-200 bg-forest-50/20'
                  : 'border-border bg-background-card opacity-80'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-foreground">{step.label}</h3>
                      <p className="text-[11px] font-semibold text-forest-700">{step.cashback} Cashback</p>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="w-6 h-6 rounded-full bg-forest-700 text-white flex items-center justify-center text-xs shadow-2xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-foreground-muted tabular-nums">
                      Étape {idx + 1}
                    </span>
                  )}
                </div>

                <p className="text-xs text-foreground-muted leading-snug">
                  Condition : <strong className="text-foreground font-semibold">{step.reqText}</strong>
                </p>
              </div>

              {/* Jauge spécifique à l'étape */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex justify-between text-[11px] font-semibold text-foreground-muted">
                  <span>Progression</span>
                  <span className="tabular-nums text-foreground">{stepProgressPct}%</span>
                </div>
                <div className="w-full h-2 rounded-pill bg-background-alt border border-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-pill transition-all duration-500',
                      isUnlocked ? 'bg-forest-700' : 'bg-lime-500'
                    )}
                    style={{ width: `${stepProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
