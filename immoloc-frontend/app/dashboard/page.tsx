'use client';

import { AlertCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { CancellationWarningBanner } from '@/features/dashboard/components/owner/CancellationWarningBanner';
import { MobileQuickActionsMenu } from '@/features/dashboard/components/owner/MobileQuickActionsMenu';
import { useOwnerOverview } from '@/features/owner-home/hooks/use-owner-overview';
import { RevenueTile } from '@/features/owner-home/components/RevenueTile';
import { OccupancyTile } from '@/features/owner-home/components/OccupancyTile';
import { DecisionTile } from '@/features/owner-home/components/DecisionTile';
import { PlanningTile, TodayTile } from '@/features/owner-home/components/UpcomingTiles';
import {
  PerformanceTile,
  ReputationTile,
  TipTile,
  WalletTile,
} from '@/features/owner-home/components/MoneyTiles';
import { formatLong } from '@/features/calendar/lib/days';
import { HomeSkeleton } from '@/features/owner-home/components/HomeSkeleton';
import { usePendingDecisions } from '@/features/calendar/hooks/use-pending-decisions';

/**
 * Aujourd'hui — accueil hôte en mosaïque (direction « Bento »).
 * Ce qui demande une action (demandes, mouvements du jour) est placé au plus haut,
 * entouré des chiffres qui comptent : revenus, occupation, solde.
 */
export default function DashboardPage() {
  const { data: overview, isLoading, isError, error, refetch } = useOwnerOverview();
  const { data: user } = useCurrentUser();
  const { data: decisions = [] } = usePendingDecisions();
  const hasDecisions = decisions.length > 0;

  if (isLoading) return <HomeSkeleton />;

  const activeListings = overview?.logements.filter((l) => l.statut === 'PUBLISHED').length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      <CancellationWarningBanner />

      <header className="hidden flex-wrap items-end justify-between gap-3 sm:flex">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem]">
          Bonjour{user?.prenom ? ` ${user.prenom}` : ''},{' '}
          <span className="text-foreground-muted">voici votre journée.</span>
        </h1>
        {overview && (
          <p className="text-sm text-foreground-muted first-letter:uppercase">
            {formatLong(overview.today)} · {activeListings} bien{activeListings > 1 ? 's' : ''} en ligne
          </p>
        )}
      </header>

      {isError || !overview ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-background-card p-10 text-center">
          <AlertCircle className="h-8 w-8 text-error-500" aria-hidden="true" />
          <p className="text-sm text-foreground">
            {error instanceof Error ? error.message : 'Impossible de charger votre tableau de bord.'}
          </p>
          <button type="button" onClick={() => refetch()} className="btn-ghost px-5 py-2.5 text-sm">
            Réessayer
          </button>
        </div>
      ) : (
        // Lignes explicites : chaque ligne associe des tuiles de hauteur comparable
        // (sinon flex-wrap pouvait aligner une petite tuile à côté d'un grand tableau).
        <div className="space-y-5">
          <div className="flex flex-wrap gap-5">
            <RevenueTile revenue={overview.revenue} />
            <OccupancyTile occupancy={overview.occupancy} />
            <TodayTile />
          </div>

          {hasDecisions && (
            <div className="flex flex-wrap gap-5">
              <DecisionTile />
              <WalletTile wallet={overview.wallet} />
            </div>
          )}

          <div className="flex flex-wrap gap-5">
            <PlanningTile />
            <PerformanceTile logements={overview.logements} month={overview.revenue.monthly.at(-1)!.month} />
          </div>

          <div className="flex flex-wrap gap-5">
            {!hasDecisions && <WalletTile wallet={overview.wallet} />}
            <TipTile tips={overview.tips} />
            <ReputationTile reputation={overview.reputation} />
          </div>
        </div>
      )}

      <div className="sm:hidden">
        <MobileQuickActionsMenu />
      </div>
    </div>
  );
}
