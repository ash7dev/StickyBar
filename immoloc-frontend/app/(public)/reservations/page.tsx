'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { History, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'PAID', 'DISPUTED'];

function TenantReservationsContent() {
  const [activeTab, setActiveTab] = useState<ReservationTabId>('ALL');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const { activeRole } = useRoleStore();

  const { data: reservations, isLoading, error } = useQuery<TenantReservation[]>({
    queryKey: ['reservations', 'me', activeRole],
    queryFn: () => nestFetch<TenantReservation[]>(NEST_API.RESERVATIONS.MINE()),
    enabled: activeRole === 'LOCATAIRE',
  });

  const totalCount = reservations?.length ?? 0;
  const confirmedCount = reservations?.filter((r) => r.statut === 'CONFIRMED' || r.statut === 'PAID').length ?? 0;
  const checkedInCount = reservations?.filter((r) => r.statut === 'CHECKED_IN').length ?? 0;
  const completedCount = reservations?.filter((r) => r.statut === 'COMPLETED').length ?? 0;
  const cancelledCount = reservations?.filter((r) => r.statut === 'CANCELLED' || r.statut === 'EXPIRED').length ?? 0;

  const filtered = reservations?.filter((r) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'CONFIRMED') return r.statut === 'CONFIRMED' || r.statut === 'PAID';
    if (activeTab === 'CHECKED_IN') return r.statut === 'CHECKED_IN';
    if (activeTab === 'COMPLETED') return r.statut === 'COMPLETED';
    if (activeTab === 'CANCELLED') return r.statut === 'CANCELLED' || r.statut === 'EXPIRED';
    return true;
  });

  const activeList = filtered?.filter((r) => ACTIVE_STATUSES.includes(r.statut)) ?? [];
  const historyList = filtered?.filter((r) => !ACTIVE_STATUSES.includes(r.statut)) ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12 pb-24 space-y-8">
      {/* En-tête de la page avec statistiques & filtre segmenté */}
      <TenantReservationsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={totalCount}
        confirmedCount={confirmedCount}
        checkedInCount={checkedInCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
      />

      {/* État d'erreur */}
      {error && (
        <div className="bg-error-50 border border-error-100 rounded-card p-5 text-center text-error-700 text-sm font-medium">
          Impossible de charger vos réservations. Veuillez rafraîchir la page.
        </div>
      )}

      {/* Chargement Skeleton Ultra-Fluide */}
      {isLoading && <TenantReservationsPageSkeleton />}

      {/* État vide */}
      {!isLoading && !error && filtered?.length === 0 && (
        <TenantReservationsEmptyState filtered={activeTab !== 'ALL'} />
      )}

      {/* Liste des Réservations */}
      {!isLoading && !error && filtered && filtered.length > 0 && (
        <>
          {activeTab === 'ALL' ? (
            <div className="space-y-8">
              {/* Section 1: Séjours actifs & à venir */}
              {activeList.length > 0 ? (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {activeList.map((reservation) => (
                    <TenantReservationCardItem key={reservation.id} reservation={reservation} />
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-card border border-border bg-background-alt text-xs font-semibold text-foreground-muted">
                  Aucun séjour actif pour le moment.
                </div>
              )}

              {/* Section 2: Historique dépliable des séjours passés & annulés */}
              {historyList.length > 0 && (
                <div className="border-t border-border/80 pt-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="flex items-center justify-between w-full p-4 rounded-card border border-border bg-background-card hover:bg-background-alt transition-colors group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-slate-100 text-slate-700">
                        <History className="h-4.5 w-4.5" />
                      </span>
                      <div className="text-left">
                        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                          Historique des séjours & annulations
                          <span className="px-2 py-0.5 rounded-pill bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                            {historyList.length}
                          </span>
                        </h3>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {showHistory
                            ? 'Cliquez pour replier la liste de l\'historique'
                            : 'Séjours terminés, annulations et réservations archivées'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-100 px-3 py-1.5 rounded-pill group-hover:bg-forest-100 transition-colors">
                      <span>{showHistory ? 'Masquer' : 'Dérouler l\'historique'}</span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', showHistory && 'rotate-180')} />
                    </div>
                  </button>

                  {showHistory && (
                    <div className="flex flex-col gap-3 sm:gap-4">
                      {historyList.map((reservation) => (
                        <TenantReservationCardItem key={reservation.id} reservation={reservation} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Onglet spécifique sélectionné (ex: Confirmées, En cours, Terminées, Annulées) */
            <div className="flex flex-col gap-3 sm:gap-4">
              {filtered.map((reservation) => (
                <TenantReservationCardItem key={reservation.id} reservation={reservation} />
              ))}
            </div>
          )}
        </>
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
