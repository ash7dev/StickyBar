'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Search, AlertCircle, X, History, ChevronDown, Sparkles } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { Reservation } from '@/features/reservations/components/reservation-card';
import { OwnerReservationCard } from '@/features/reservations/components/owner/OwnerReservationCard';
import { OwnerReservationSkeleton } from '@/features/reservations/components/owner/OwnerReservationSkeleton';
import { OwnerReservationsEmptyState } from '@/features/reservations/components/owner/OwnerReservationsEmptyState';
import { cn } from '@/lib/utils/cn';
import DashboardLoading from '../loading';

/* ─── Status Filter Tabs Config ─────────────────────────────────────────────── */

const STATUS_TABS = [
  { id: 'ALL',        label: 'Toutes',     dot: 'bg-forest-600' },
  { id: 'PENDING',    label: 'En attente', dot: 'bg-amber-500' },
  { id: 'CONFIRMED',  label: 'Confirmées', dot: 'bg-blue-600' },
  { id: 'CHECKED_IN', label: 'En séjour',   dot: 'bg-emerald-500 animate-pulse' },
  { id: 'COMPLETED',  label: 'Terminées',  dot: 'bg-slate-400' },
  { id: 'CANCELLED',  label: 'Annulées',   dot: 'bg-rose-500' },
];

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'PAID', 'DISPUTED'];

function ReservationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Initialise depuis le param URL ?q= (venant du header search ou d'un lien direct)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');

  // Synchronise la valeur de recherche dans l'URL (replace = pas de pollution de l'historique)
  const syncUrl = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }
    router.replace(`/dashboard/reservations?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Si l'URL change (ex: navigation depuis le header), on re-synchronise
  useEffect(() => {
    const urlQ = searchParams.get('q') ?? '';
    if (urlQ !== searchQuery) setSearchQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  // Split active vs history for "ALL" tab
  const activeList = filteredReservations.filter((r) => ACTIVE_STATUSES.includes(r.statut));
  const historyList = filteredReservations.filter((r) => !ACTIVE_STATUSES.includes(r.statut));

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
            type="search"
            value={searchQuery}
            onChange={(e) => {
              const v = e.target.value;
              setSearchQuery(v);
              syncUrl(v);
            }}
            placeholder="Rechercher par logement ou locataire..."
            className="w-full pl-10 pr-10 py-2 rounded-pill bg-background-alt border border-border/80 text-xs font-semibold text-forest-950 placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); syncUrl(''); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted hover:text-forest-950 transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
                ? 'bg-forest-950 text-on-inverse-marker shadow-md'
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
                ? 'bg-forest-950 text-on-inverse-marker shadow-md'
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
                'inline-flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-extrabold shrink-0 transition-all border shadow-2xs cursor-pointer',
                isActive
                  ? 'bg-forest-950 text-on-inverse-marker border-forest-950 shadow-md'
                  : 'bg-background-card hover:bg-background-alt text-forest-950 border-border/80',
              )}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', tab.dot)} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-pill text-[10px] font-black',
                  isActive
                    ? 'bg-action text-on-action'
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
        <>
          {/* Si onglet "Toutes", on sépare Réservations Actives vs Historique dépliable */}
          {activeTab === 'ALL' ? (
            <div className="space-y-8">
              {/* Section 1: Réservations Actives / En cours */}
              {activeList.length > 0 ? (
                <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3.5')}>
                  {activeList.map((reservation) => (
                    <OwnerReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      viewMode={viewMode}
                      onConfirm={(id) => confirmMutation.mutate(id)}
                      onCancel={(id) => cancelMutation.mutate(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-card border border-border bg-background-alt text-xs font-semibold text-foreground-muted">
                  Aucune réservation active en cours ou à venir.
                </div>
              )}

              {/* Section 2: Historique Dépliable (Terminées, Annulées) */}
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
                        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
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
                    <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3.5')}>
                      {historyList.map((reservation) => (
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
              )}
            </div>
          ) : (
            /* Si un onglet spécifique est sélectionné (ex: Terminées, Annulées, En séjour...) */
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
        </>
      )}

    </div>
  );
}

// useSearchParams() doit être dans un composant envelopé par <Suspense>
export default function ReservationsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <ReservationsContent />
    </Suspense>
  );
}
