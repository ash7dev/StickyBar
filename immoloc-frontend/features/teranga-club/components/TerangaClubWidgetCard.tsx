'use client';

import Link from 'next/link';
import { Sparkles, Coins } from 'lucide-react';
import { useTerangaClub } from '../hooks/use-teranga-club';
import { cn } from '@/lib/utils/cn';

export function TerangaClubWidgetCard() {
  const { data, isAuthenticated } = useTerangaClub();

  return (
    <section className="rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Partie gauche (icône, titre, badge, description) */}
        <div className="flex min-w-0 items-start gap-3.5">
          <span className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-inner border',
            isAuthenticated && data && data.soldeCoins > 0
              ? 'border-forest-100 bg-forest-50 text-forest-700'
              : 'border-border bg-background-alt text-foreground-muted'
          )}>
            <Coins className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-foreground">
                Klef Teranga Club 🪙
              </h3>
              <span className="inline-flex items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
                1 Coin = 1 FCFA
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
              {isAuthenticated && data ? (
                <>
                  Vous êtes au rang <strong className="font-semibold text-foreground">{data.tier}</strong> avec{' '}
                  <strong className="font-bold text-gold-600 dark:text-gold-400">{data.soldeCoins.toLocaleString('fr-FR')} Klef Coins</strong> dans votre portefeuille.
                </>
              ) : (
                <>Cumulez du cashback sur vos séjours, débloquez des privilèges VIP et réduisez vos prochains acomptes.</>
              )}
            </p>
          </div>
        </div>

        {/* Partie droite : Bouton CTA Lime bg-action */}
        <div className="sm:shrink-0">
          <Link
            href="/teranga-club"
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-action px-5 py-2.5 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98] sm:w-auto"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Découvrir le Club</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
