'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Search, AlertCircle, X, History, ChevronDown } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { Reservation } from '@/features/reservations/components/reservation-card';
import { OwnerReservationCard } from '@/features/reservations/components/owner/OwnerReservationCard';
import { OwnerReservationSkeleton } from '@/features/reservations/components/owner/OwnerReservationSkeleton';
import { OwnerReservationsEmptyState } from '@/features/reservations/components/owner/OwnerReservationsEmptyState';
import { cn } from '@/lib/utils/cn';
import DashboardLoading from '../loading';

/* ⚠️ `amber`, `blue`, `emerald`, `slate`, `rose` : cinq familles absentes de
   la palette Klef. Les six pastilles de statut n'avaient donc aucune couleur.
   Ajout de PAID et DISPUTED : ils figuraient dans ACTIVE_STATUSES mais aucun
   onglet ne permettait de les isoler — or « décision requise » est l'état le
   plus urgent du produit. */
const STATUS_TABS = [
  { id: 'ALL', label: 'Toutes', dot: 'bg-forest-600' },
  { id: 'PAID', label: 'À décider', dot: 'bg-gold-400', live: true },
  { id: 'PENDING', label: 'En attente', dot: 'bg-warning-500' },
  { id: 'CONFIRMED', label: 'Confirmées', dot: 'bg-forest-500' },
  { id: 'CHECKED_IN', label: 'En séjour', dot: 'bg-success-500', live: true },
  { id: 'COMPLETED', label: 'Terminées', dot: 'bg-forest-300' },
  { id: 'DISPUTED', label: 'Litiges', dot: 'bg-error-500', live: true },
  { id: 'CANCELLED', label: 'Annulées', dot: 'bg-error-600' },
] as const;

const ACTIVE_STATUSES = ['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'DISPUTED'];

function ReservationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [actionError, setActionError] = useState<string | null>(null);

  /* `router.replace` à chaque frappe repoussait une entrée d'historique et
     relançait le rendu du segment. Débouncé à 400 ms. */
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const value = searchQuery.trim();
      if (value) params.set('q', value);
      else params.delete('q');
      const next = params.toString();
      if (next === searchParams.toString()) return;
      router.replace(`/dashboard/reservations${next ? `?${next}` : ''}`, { scroll: false });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams]);

  const { data: allReservations = [], isLoading, error } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'mine'],
    queryFn: () => nestFetch<Reservation[]>(NEST_API.RESERVATIONS.MINE()),
    staleTime: 30_000,
  });

  /* Les quatre filtres se rejouaient à chaque frappe sur toute la liste. */
  const { validReservations, filtered, activeList, historyList, counts } = useMemo(() => {
    const valid = allReservations.filter((r) => r.statut !== 'EXPIRED');

    const q = searchQuery.trim().toLowerCase();
    const matches = (r: Reservation) => {
      if (!q) return true;
      const titre = r.logement?.titre?.toLowerCase() ?? '';
      const loc = `${r.locataire?.prenom ?? ''} ${r.locataire?.nom ?? ''}`.toLowerCase();
      return titre.includes(q) || loc.includes(q);
    };

    const list = valid
      .filter((r) => activeTab === 'ALL' || r.statut === activeTab)
      .filter(matches);

    const byStatus = new Map<string, number>();
    valid.forEach((r) => byStatus.set(r.statut, (byStatus.get(r.statut) ?? 0) + 1));

    return {
      validReservations: valid,
      filtered: list,
      activeList: list.filter((r) => ACTIVE_STATUSES.includes(r.statut)),
      historyList: list.filter((r) => !ACTIVE_STATUSES.includes(r.statut)),
      counts: byStatus,
    };
  }, [allReservations, activeTab, searchQuery]);

  /* `CANCEL` était en POST alors que tout le reste du code utilise PATCH, et
     aucune des deux mutations n'envoyait de corps — or l'API exige un motif.
     Ces boutons échouaient en silence : pas d'onError, donc aucun retour.
     La confirmation demande aussi une heure de check-in : elle doit passer
     par le panneau détaillé, pas par un bouton de liste. */
  const cancelMutation = useMutation({
    mutationFn: ({ id, raison }: { id: string; raison: string }) =>
      nestFetch(NEST_API.RESERVATIONS.CANCEL(id), {
        method: 'PATCH',
        body: JSON.stringify({ raison }),
      }),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ['reservations', 'mine'] });
    },
    onError: (e) => {
      setActionError(e instanceof Error ? e.message : 'L’annulation n’a pas abouti.');
    },
  });

  const handleOpen = useCallback((id: string) => {
    router.push(`/dashboard/reservations/${id}`);
  }, [router]);

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
    : 'space-y-3.5';

  return (
    <div className="space-y-6 pb-12">

      <header>
        <p className="eyebrow mb-1.5 text-foreground-muted">Gestion</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Mes réservations
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Validez les demandes, gérez les états des lieux et suivez vos séjours.
        </p>
      </header>

      {/* ── Recherche et affichage ─────────────────────────────────────────── */}

      <div className="flex flex-col justify-between gap-4 rounded-card border border-border bg-background-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="reservations-search" className="sr-only">
            Rechercher une réservation
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden="true"
          />
          <input
            id="reservations-search"
            /* `type="search"` ajoute un bouton d'effacement natif Safari qui
               doublait celui du composant. */
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Logement ou locataire…"
            className="w-full rounded-pill border border-border bg-background-alt py-2 pr-10 pl-10 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Effacer la recherche"
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-foreground-muted transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div
          role="radiogroup"
          aria-label="Mode d’affichage"
          className="flex shrink-0 items-center gap-1.5 self-end rounded-pill border border-border bg-background-alt p-1 sm:self-auto"
        >
          {([
            { mode: 'list' as const, icon: List, label: 'Liste' },
            { mode: 'grid' as const, icon: LayoutGrid, label: 'Grille' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={viewMode === mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors',
                viewMode === mode
                  ? 'bg-forest-600 text-neutral-0'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Onglets de statut ──────────────────────────────────────────────── */}

      <div role="tablist" aria-label="Filtrer par statut" className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === 'ALL' ? validReservations.length : (counts.get(tab.id) ?? 0);
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2 text-xs font-semibold transition-colors',
                isActive
                  ? 'border-forest-600 bg-forest-600 text-neutral-0'
                  : 'border-border bg-background-card text-foreground hover:bg-background-alt',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-2 w-2 shrink-0 rounded-pill',
                  tab.dot,
                  /* `animate-pulse` était figé sur CHECKED_IN. Réservé aux
                     statuts qui demandent réellement une action. */
                  'live' in tab && tab.live && count > 0 && 'animate-pulse',
                )}
              />
              {tab.label}
              <span
                className={cn(
                  'rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums',
                  isActive ? 'bg-white/20' : 'bg-background-alt text-foreground-muted',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── États ──────────────────────────────────────────────────────────── */}

      {(error || actionError) && (
        <div role="alert" className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-4 text-xs text-error-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          {actionError ?? 'Impossible de charger vos réservations. Rafraîchissez la page.'}
        </div>
      )}

      {isLoading && (
        <div className={gridClass} aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <OwnerReservationSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <OwnerReservationsEmptyState
          hasFilter={searchQuery.trim().length > 0 || activeTab !== 'ALL'}
          onResetFilter={() => {
            setSearchQuery('');
            setActiveTab('ALL');
          }}
        />
      )}

      {/* ── Liste ──────────────────────────────────────────────────────────── */}

      {!isLoading && !error && filtered.length > 0 && (
        activeTab === 'ALL' ? (
          <div className="space-y-8">
            {activeList.length > 0 ? (
              <div className={gridClass}>
                {activeList.map((r) => (
                  <OwnerReservationCard
                    key={r.id}
                    reservation={r}
                    viewMode={viewMode}
                    onCancel={(id) => cancelMutation.mutate({ id, raison: 'Annulé par le propriétaire' })}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-card border border-border bg-background-alt p-4 text-xs text-foreground-muted">
                Aucune réservation active pour le moment.
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
                  <div className={gridClass}>
                    {historyList.map((r) => (
                      <OwnerReservationCard
                        key={r.id}
                        reservation={r}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={gridClass}>
            {filtered.map((r) => (
              <OwnerReservationCard
                key={r.id}
                reservation={r}
                viewMode={viewMode}
                onCancel={(id) => cancelMutation.mutate({ id, raison: 'Annulé par le propriétaire' })}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <ReservationsContent />
    </Suspense>
  );
}