'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { TenantReservationsGuard } from '@/features/reservations/components/tenant/TenantReservationsGuard';
import {
  TenantReservationsHeader,
  type ReservationTabId,
} from '@/features/reservations/components/tenant/TenantReservationsHeader';
import {
  TenantReservationCardItem,
  TenantReservationsEmptyState,
} from '@/features/reservations/components/tenant/TenantReservationsList';
import { TenantReservationsPageSkeleton } from '@/features/reservations/components/tenant/TenantReservationsSkeleton';
import type { TenantReservation } from '@/features/reservations/components/tenant-reservation-card';

const ACTIVE_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'DISPUTED'];

/* Correspondance onglet → statuts, déclarée une fois.
   ⚠️ `PENDING` et `DISPUTED` figurent dans ACTIVE_STATUSES mais n'étaient
   comptés par aucun onglet : la somme des compteurs affichés était donc
   inférieure au total, et une réservation en attente de paiement ou en litige
   était introuvable autrement qu'en parcourant « Toutes ». Ils rejoignent
   « Confirmées » faute d'onglet dédié — l'idéal reste d'en ajouter un dans
   TenantReservationsHeader. */
const TAB_STATUSES: Record<Exclude<ReservationTabId, 'ALL'>, string[]> = {
  CONFIRMED: ['CONFIRMED', 'PAID', 'PENDING', 'DISPUTED'],
  CHECKED_IN: ['CHECKED_IN'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED', 'EXPIRED'],
};

function TenantReservationsContent() {
  const [activeTab, setActiveTab] = useState<ReservationTabId>('ALL');
  const [showHistory, setShowHistory] = useState(false);
  const activeRole = useRoleStore((s) => s.activeRole);

  const { data: reservations, isLoading, error } = useQuery<TenantReservation[]>({
    queryKey: ['reservations', 'me', activeRole],
    queryFn: () => nestFetch<TenantReservation[]>(NEST_API.RESERVATIONS.MINE()),
    enabled: activeRole === 'LOCATAIRE',
  });

  /* Six parcours complets de la liste à chaque rendu. */
  const { counts, filtered, activeList, historyList } = useMemo(() => {
    const all = reservations ?? [];
    const countIn = (statuses: string[]) => all.filter((r) => statuses.includes(r.statut)).length;

    const list = activeTab === 'ALL'
      ? all
      : all.filter((r) => TAB_STATUSES[activeTab].includes(r.statut));

    return {
      counts: {
        total: all.length,
        confirmed: countIn(TAB_STATUSES.CONFIRMED),
        checkedIn: countIn(TAB_STATUSES.CHECKED_IN),
        completed: countIn(TAB_STATUSES.COMPLETED),
        cancelled: countIn(TAB_STATUSES.CANCELLED),
      },
      filtered: list,
      activeList: list.filter((r) => ACTIVE_STATUSES.includes(r.statut)),
      historyList: list.filter((r) => !ACTIVE_STATUSES.includes(r.statut)),
    };
  }, [reservations, activeTab]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-10 pb-24 sm:px-6 lg:px-8 lg:pt-12">

      <TenantReservationsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={counts.total}
        confirmedCount={counts.confirmed}
        checkedInCount={counts.checkedIn}
        completedCount={counts.completed}
        cancelledCount={counts.cancelled}
      />

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-5 text-sm text-error-700"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          Impossible de charger vos réservations. Rafraîchissez la page.
        </div>
      )}

      {isLoading && <TenantReservationsPageSkeleton />}

      {!isLoading && !error && filtered.length === 0 && (
        <TenantReservationsEmptyState filtered={activeTab !== 'ALL'} />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        activeTab === 'ALL' ? (
          <div className="space-y-8">
            {activeList.length > 0 ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                {activeList.map((r) => (
                  <TenantReservationCardItem key={r.id} reservation={r} />
                ))}
              </div>
            ) : (
              <p className="rounded-card border border-border bg-background-alt p-4 text-xs text-foreground-muted">
                Aucun séjour en cours ou à venir.
              </p>
            )}

            {historyList.length > 0 && (
              <div className="space-y-4 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  aria-expanded={showHistory}
                  className="group flex w-full items-center justify-between gap-4 rounded-card border border-border bg-background-card p-4 text-left transition-colors hover:bg-background-alt"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {/* `slate` n'existe pas dans la palette : ce bloc rendait
                       sans fond, sans bordure et sans couleur de texte. */}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-border bg-background-alt text-foreground-muted">
                      <History className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-display text-sm font-semibold text-foreground">
                        Historique
                        <span className="rounded-pill border border-border bg-background-alt px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground-muted">
                          {historyList.length}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        Séjours terminés et réservations annulées
                      </p>
                    </div>
                  </div>

                  <span className="flex shrink-0 items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-xs font-semibold text-foreground-muted">
                    {showHistory ? 'Masquer' : 'Afficher'}
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform duration-200', showHistory && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {showHistory && (
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {historyList.map((r) => (
                      <TenantReservationCardItem key={r.id} reservation={r} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {filtered.map((r) => (
              <TenantReservationCardItem key={r.id} reservation={r} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function TenantReservationsPage() {
  return (
    <TenantReservationsGuard>
      <TenantReservationsContent />
    </TenantReservationsGuard>
  );
}