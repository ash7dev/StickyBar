'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Search, AlertCircle, CalendarCheck } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { Reservation } from '@/features/reservations/components/reservation-card';
import { OwnerReservationCard } from '@/features/reservations/components/owner/OwnerReservationCard';
import { OwnerReservationSkeleton } from '@/features/reservations/components/owner/OwnerReservationSkeleton';
import { OwnerReservationsEmptyState } from '@/features/reservations/components/owner/OwnerReservationsEmptyState';
import { cn } from '@/lib/utils/cn';

/* ─── Status Filter Tabs Config ─────────────────────────────────────────────── */

const STATUS_TABS = [
  { id: 'ALL',        label: 'Toutes'     },
  { id: 'PENDING',    label: 'En attente' },
  { id: 'CONFIRMED',  label: 'Confirmées' },
  { id: 'CHECKED_IN', label: 'En séjour'   },
  { id: 'COMPLETED',  label: 'Terminées'  },
  { id: 'CANCELLED',  label: 'Annulées'   },
];

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch reservations for the logged-in owner
  const { data: allReservations = [], isLoading, error } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'mine'],
    queryFn: () => nestFetch<Reservation[]>(NEST_API.RESERVATIONS.MINE()),
    staleTime: 30_000,
  });

  // Filter out expired draft reservations
  const validReservations = allReservations.filter((r) => r.statut !== 'EXPIRED');

  // Filter by tab
  const tabFiltered = validReservations.filter((r) => {
    if (activeTab === 'ALL') return true;
    return r.statut === activeTab;
  });

  // Filter by search query (titre logement ou nom locataire)
  const filteredReservations = tabFiltered.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titre = r.logement?.titre?.toLowerCase() ?? '';
    const locataire = `${r.locataire?.prenom ?? ''} ${r.locataire?.nom ?? ''}`.toLowerCase();
    return titre.includes(q) || locataire.includes(q);
  });

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: (id: string) => nestFetch(NEST_API.RESERVATIONS.CONFIRM(id), { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations', 'mine'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => nestFetch(NEST_API.RESERVATIONS.CANCEL(id), { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations', 'mine'] }),
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* ══ Header de la Page ═════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="eyebrow">Gestion & Planning</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Mes Réservations
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Gérez les arrivées, validez les états des lieux et suivez le calendrier de vos séjours en temps réel.
        </p>
      </div>

      {/* ══ Top Bar Filter & View Switcher ════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-card rounded-card border border-border/80 p-3.5 sm:p-4 shadow-2xs">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par logement ou locataire..."
            className="w-full pl-10 pr-4 py-2 rounded-pill bg-background-alt border border-border/80 text-xs font-semibold text-forest-950 placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Mode d'affichage Toggle (Par défaut : Liste Horizontale) */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-background-alt p-1 rounded-pill border border-border/80 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="Affichage en liste"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-extrabold transition-all',
              viewMode === 'list'
                ? 'bg-forest-950 text-lime-400 shadow-md'
                : 'text-foreground-muted hover:text-forest-950',
            )}
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline">Liste</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Affichage en grille"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-extrabold transition-all',
              viewMode === 'grid'
                ? 'bg-forest-950 text-lime-400 shadow-md'
                : 'text-foreground-muted hover:text-forest-950',
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">Grille</span>
          </button>
        </div>

      </div>

      {/* ══ Status Filter Tabs ════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === 'ALL'
            ? validReservations.length
            : validReservations.filter((r) => r.statut === tab.id).length;

          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-extrabold shrink-0 transition-all border shadow-2xs',
                isActive
                  ? 'bg-forest-950 text-lime-400 border-forest-950 shadow-md'
                  : 'bg-background-card hover:bg-background-alt text-forest-950 border-border/80',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-pill text-[10px] font-black',
                  isActive
                    ? 'bg-lime-400 text-forest-950'
                    : 'bg-background-alt text-forest-950 border border-border/60',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══ Error State ═══════════════════════════════════════════════════════ */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-card bg-error-50 border border-error-200 text-error-700 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-error-600" />
          <span>Impossible de charger vos réservations. Veuillez rafraîchir la page.</span>
        </div>
      )}

      {/* ══ Loading State ═════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3.5')}>
          {Array.from({ length: 4 }).map((_, i) => (
            <OwnerReservationSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* ══ Empty State ═══════════════════════════════════════════════════════ */}
      {!isLoading && !error && filteredReservations.length === 0 && (
        <OwnerReservationsEmptyState hasFilter={searchQuery.trim().length > 0 || activeTab !== 'ALL'} />
      )}

      {/* ══ Reservations List ═════════════════════════════════════════════════ */}
      {!isLoading && !error && filteredReservations.length > 0 && (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3.5')}>
          {filteredReservations.map((reservation) => (
            <OwnerReservationCard
              key={reservation.id}
              reservation={reservation}
              viewMode={viewMode}
              onConfirm={(id) => confirmMutation.mutate(id)}
              onCancel={(id) => cancelMutation.mutate(id)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
