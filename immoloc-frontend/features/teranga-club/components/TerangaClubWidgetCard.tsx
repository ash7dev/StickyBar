'use client';

import Link from 'next/link';
import { Sparkles, Coins } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTerangaClub } from '../hooks/use-teranga-club';

const TIER_LABELS: Record<string, string> = {
  BRONZE: 'Clé de Bronze',
  SILVER: 'Clé d’Argent',
  GOLD: 'Clé d’Or',
};

export function TerangaClubWidgetCard() {
  const { data, isAuthenticated, isLoading } = useTerangaClub();

  const solde = Number(data?.soldeCoins) || 0;
  const actif = isAuthenticated && solde > 0;
  const tierLabel = data?.tier ? TIER_LABELS[data.tier] ?? data.tier : null;

  /* Sans état de chargement, le texte passait de l'accroche générique au
     solde personnel après coup, avec un saut visible. */
  if (isLoading) {
    return (
      <div
        aria-hidden="true"
        className="h-[92px] animate-pulse rounded-card border border-border bg-background-alt"
      />
    );
  }

  return (
    <section className="rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div className="flex min-w-0 items-start gap-3.5">
          {/* Le gold est la couleur du système de récompense dans le produit
             (quêtes, historique, cashback). Le vert ici créait une quatrième
             convention pour la même notion. */}
          <span className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-inner border',
            actif
              ? 'border-gold-200 bg-gold-50 text-gold-700'
              : 'border-border bg-background-alt text-foreground-muted',
          )}>
            <Coins className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* L'emoji 🪙 doublonnait l'icône Coins juste à gauche, et les
                 lecteurs d'écran l'annonçaient littéralement. */}
              <h2 className="font-display text-base font-semibold text-foreground">
                Klef Teranga Club
              </h2>
              <span className="inline-flex items-center rounded-pill border border-border bg-background-alt px-2.5 py-0.5 text-xs font-semibold text-foreground-muted">
                1 coin = 1 FCFA
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
              {isAuthenticated && data ? (
                <>
                  {/* `data.tier` s'affichait brut : « BRONZE » en majuscules,
                     alors que la modale de récompense parle déjà de « Clé
                     d'Argent ». Deux vocabulaires pour la même chose. */}
                  Rang <span className="font-semibold text-foreground">{tierLabel}</span> ·{' '}
                  <span className="font-semibold tabular-nums text-gold-700">
                    {solde.toLocaleString('fr-FR')} coins
                  </span>{' '}
                  disponibles
                </>
              ) : (
                <>
                  Cumulez du cashback sur vos séjours et réduisez le montant de vos prochaines
                  réservations.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="sm:shrink-0">
          <Link
            href="/teranga-club"
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-action px-5 py-2.5 text-sm font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98] sm:w-auto"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {/* Un membre connecté ne « découvre » plus le club. */}
            {isAuthenticated ? 'Mon Teranga Club' : 'Découvrir le Club'}
          </Link>
        </div>
      </div>
    </section>
  );
}