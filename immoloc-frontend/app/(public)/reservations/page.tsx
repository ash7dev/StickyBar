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
import { Loader2 } from 'lucide-react';

function TenantReservationsContent() {
  const [activeTab, setActiveTab] = useState<ReservationTabId>('ALL');
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

      {/* Liste des Réservations (Rangées horizontales compactes sur Mobile, Cartes complètes sur Desktop) */}
      {!isLoading && !error && filtered && filtered.length > 0 && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {filtered.map((reservation) => (
            <TenantReservationCardItem key={reservation.id} reservation={reservation} />
          ))}
        </div>
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
