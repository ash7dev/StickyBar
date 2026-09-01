'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { GestionnaireReservationsStatsHeader } from '@/features/gestionnaire/components/GestionnaireReservationsStatsHeader';
import { GestionnaireReservationsFilterBar, ReservationFilterOptions } from '@/features/gestionnaire/components/GestionnaireReservationsFilterBar';
import { OwnerReservationCard } from '@/features/reservations/components/owner/OwnerReservationCard';
import { OwnerReservationSkeleton } from '@/features/reservations/components/owner/OwnerReservationSkeleton';
import type { Reservation } from '@/features/reservations/components/reservation-card';
import { KeyRound, AlertCircle, RefreshCw } from 'lucide-react';

export default function GestionnaireReservationsPage() {
  const [filters, setFilters] = useState<ReservationFilterOptions>({
    searchQuery: '',
    statusFilter: 'ALL',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Données réelles depuis le serveur NestJS
  const {
    data: allReservations = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'gestionnaire'],
    queryFn: () => nestFetch<Reservation[]>(NEST_API.RESERVATIONS.MINE()),
    staleTime: 15_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, raison }: { id: string; raison: string }) =>
      nestFetch(NEST_API.RESERVATIONS.CANCEL(id), {
        method: 'PATCH',
        body: JSON.stringify({ raison }),
      }),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['reservations', 'gestionnaire'] });
    },
    onError: (e) => {
      setActionError(e instanceof Error ? e.message : 'L’annulation de la réservation n’a pas abouti.');
    },
  });

  const handleFilterChange = (updated: Partial<ReservationFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  // Filtrage et Tri combiné
  const { filtered, counts } = useMemo(() => {
    const valid = allReservations.filter((r) => r.statut !== 'EXPIRED');
    const byStatus = new Map<string, number>();
    valid.forEach((r) => byStatus.set(r.statut, (byStatus.get(r.statut) ?? 0) + 1));

    let result = [...valid];

    if (filters.statusFilter !== 'ALL') {
      result = result.filter((r) => r.statut === filters.statusFilter);
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const titleMatch = (r.logement?.titre || '').toLowerCase().includes(q);
        const cityMatch = (r.logement?.ville || '').toLowerCase().includes(q);
        const travelerMatch = `${r.locataire?.prenom || ''} ${r.locataire?.nom || ''}`.toLowerCase().includes(q);
        const codeMatch = (r.id || '').toLowerCase().includes(q);
        return titleMatch || cityMatch || travelerMatch || codeMatch;
      });
    }

    return {
      filtered: result,
      counts: byStatus,
    };
  }, [allReservations, filters]);

  const gridClass =
    viewMode === 'grid'
      ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
      : 'space-y-4';

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. En-tête ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Réservations Conciergerie
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Suivi des arrivées, départs, séjours en cours et gestion des états des lieux sous mandat.
          </p>
        </div>
      </div>

      {/* ── 2. Bannière de synthèse KPI ─────────────────────────────────────── */}
      {allReservations && <GestionnaireReservationsStatsHeader reservations={allReservations} />}

      {/* ── 3. Barre de filtre et de recherche ─────────────────────────────────── */}
      <GestionnaireReservationsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        statusCounts={counts}
        totalCount={allReservations.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* ── Erreurs d'action ────────────────────────────────────────────────── */}
      {(error || actionError) && (
        <div className="rounded-card border border-error-500/20 bg-error-50 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-error-700 font-medium">
            <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
            <span>{actionError ?? 'Impossible de charger la liste des réservations gérées.'}</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-error-600 text-white text-xs font-semibold hover:bg-error-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      )}

      {/* ── Chargement Skeleton ────────────────────────────────────────────── */}
      {isLoading && (
        <div className={gridClass} aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <OwnerReservationSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* ── État vide ─────────────────────────────────────────────────────── */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-card border border-dashed border-border bg-background-card p-16 text-center shadow-xs space-y-4 min-h-[320px] flex flex-col items-center justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-inner bg-forest-50 text-forest-700 mx-auto">
            <KeyRound className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-foreground">
            {filters.searchQuery || filters.statusFilter !== 'ALL'
              ? 'Aucune réservation ne correspond à votre recherche'
              : 'Aucune réservation enregistrée sous votre conciergerie'}
          </p>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            {filters.searchQuery || filters.statusFilter !== 'ALL'
              ? 'Essayez de réinitialiser vos critères de recherche ou d’onglet de statut.'
              : 'Les réservations confirmées et séjours en cours s’afficheront ici au fur et à mesure des réservations reçues.'}
          </p>
          {(filters.searchQuery || filters.statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => setFilters({ searchQuery: '', statusFilter: 'ALL' })}
              className="inline-flex items-center justify-center px-4 py-2 rounded-pill bg-neutral-100 text-foreground text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* ── Grille / Liste des réservations ───────────────────────────────── */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className={gridClass}>
          {filtered.map((reservation) => (
            <OwnerReservationCard
              key={reservation.id}
              reservation={reservation}
              viewMode={viewMode}
              hrefPrefix="/gestionnaire/reservations"
              onCancel={(id) => cancelMutation.mutate({ id, raison: 'Annulé par le gestionnaire conciergerie' })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
