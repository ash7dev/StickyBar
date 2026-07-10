'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { ChevronDown } from 'lucide-react';
import {
  TenantReservationCard,
  TenantReservationCardSkeleton,
  TenantReservationsEmpty,
  type TenantReservation,
} from '@/features/reservations/components/tenant-reservation-card';

/* ─── Tabs ────────────────────────────────────────────────────────────────── */

const TABS: { id: string; label: string }[] = [
  { id: 'ALL',        label: 'Toutes'    },
  { id: 'PENDING',    label: 'En attente' },
  { id: 'CONFIRMED',  label: 'Confirmées' },
  { id: 'CHECKED_IN', label: 'En cours'   },
  { id: 'COMPLETED',  label: 'Terminées'  },
  { id: 'CANCELLED',  label: 'Annulées'   },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TenantReservationsPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const { activeRole } = useRoleStore();

  const { data: reservations, isLoading, error } = useQuery<TenantReservation[]>({
    queryKey: ['reservations', 'me', activeRole],
    queryFn: () => nestFetch<TenantReservation[]>(NEST_API.RESERVATIONS.MINE()),
  });

  const filtered = reservations?.filter((r) =>
    activeTab === 'ALL' || r.statut === activeTab
  );

  const countFor = (id: string) =>
    reservations?.filter((r) => r.statut === id).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Mes réservations</h1>
        <p className="text-sm text-foreground-muted mt-0.5">
          {isLoading
            ? 'Chargement…'
            : `${reservations?.length ?? 0} réservation${(reservations?.length ?? 0) !== 1 ? 's' : ''} au total`}
        </p>
      </div>

      {/* ── Filtre en liste déroulante ── */}
      <div className="relative group">
        {/* Label flottant */}
        <label className="block text-xs font-black uppercase tracking-wider text-foreground-muted mb-2">
          Filtrer par statut
        </label>

        {/* Select personnalisé */}
        <div className="relative">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full appearance-none bg-gradient-to-br from-background-card to-neutral-50/50 border-2 border-border rounded-2xl px-5 py-4 pr-12 text-base font-bold text-foreground cursor-pointer transition-all duration-300 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:shadow-xl focus:shadow-primary-500/20 active:scale-[0.99]"
          >
            {TABS.map((tab) => {
              const count = tab.id !== 'ALL' ? countFor(tab.id) : null;
              return (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                  {count !== null && count > 0 ? ` • ${count}` : ''}
                </option>
              );
            })}
          </select>

          {/* Icône avec animation */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110">
            <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-primary-500" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Indicateur de filtre actif */}
        {activeTab !== 'ALL' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-background-card shadow-sm animate-pulse" />
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-error-50 border border-error-100 rounded-2xl p-4 text-sm text-error-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-error-500 shrink-0" />
          Impossible de charger vos réservations. Veuillez rafraîchir la page.
        </div>
      )}

      {/* ── Skeletons ── */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TenantReservationCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !error && filtered?.length === 0 && (
        <TenantReservationsEmpty filtered={activeTab !== 'ALL'} />
      )}

      {/* ── List ── */}
      {!isLoading && !error && filtered && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((reservation) => (
            <TenantReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}

    </div>
  );
}
