'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { OwnerListingCard, OwnerListing } from '@/features/listings/components/owner/OwnerListingCard';
import { OwnerListingSkeleton } from '@/features/listings/components/owner/OwnerListingSkeleton';
import { OwnerListingsEmptyState } from '@/features/listings/components/owner/OwnerListingsEmptyState';

const FILTERS = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'PUBLISHED', label: 'Publiées' },
  { id: 'PENDING_REVIEW', label: 'En révision' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'PAUSED', label: 'En pause' },
  { id: 'REJECTED', label: 'Rejetées' },
] as const;

export default function AnnoncesPage() {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: listings, isLoading, error } = useQuery<OwnerListing[]>({
    queryKey: ['listings', 'mine'],
    queryFn: () => nestFetch<OwnerListing[]>(NEST_API.LISTINGS.LIST_MINE),
  });

  const invalidate = useCallback(() => {
    setActionError(null);
    queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
  }, [queryClient]);

  /* Les deux mutations n'avaient aucun `onError` : une pause ou une activation
     de dernière minute qui échoue laissait le toggle revenir à sa position
     initiale, sans un mot. Sur `derniereMinuteActive`, le propriétaire peut
     croire avoir activé une remise de 15 % qui n'a jamais été enregistrée. */
  const toggleStatus = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) =>
      nestFetch(
        currentStatus === 'PUBLISHED' ? NEST_API.LISTINGS.PAUSE(id) : NEST_API.LISTINGS.RESUME(id),
        { method: 'POST' },
      ),
    onSuccess: invalidate,
    onError: (e) => setActionError(
      e instanceof Error && e.message ? e.message : 'Le changement de statut n’a pas abouti.',
    ),
  });

  const toggleDerniereMinute = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      nestFetch(NEST_API.LISTINGS.UPDATE(id), {
        method: 'PATCH',
        body: JSON.stringify({ derniereMinuteActive: active }),
      }),
    onSuccess: invalidate,
    onError: (e) => setActionError(
      e instanceof Error && e.message ? e.message : 'La dernière minute n’a pas pu être modifiée.',
    ),
  });

  const deleteListing = useMutation({
    mutationFn: (id: string) => nestFetch(NEST_API.LISTINGS.ARCHIVE(id), { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (e) => setActionError(
      e instanceof Error && e.message ? e.message : 'La suppression de l’annonce n’a pas abouti.',
    ),
  });

  const { filtered, counts } = useMemo(() => {
    const all = listings ?? [];
    const byStatus = new Map<string, number>();
    all.forEach((l) => byStatus.set(l.statut, (byStatus.get(l.statut) ?? 0) + 1));
    return {
      filtered: activeFilter === 'ALL' ? all : all.filter((l) => l.statut === activeFilter),
      counts: byStatus,
    };
  }, [listings, activeFilter]);

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
    : 'space-y-4';

  return (
    <div className="space-y-6 pb-12">

      {/* ── En-tête ────────────────────────────────────────────────────────── */}

      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow mb-1 text-foreground-muted">Propriétés</p>
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Mes annonces
            </h1>
          </div>

          {/* ★ Seul aplat lime de la page : la publication. */}
          <Link href="/dashboard/annonces/nouvelle" className="btn-action shrink-0 px-4 py-2.5 text-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="whitespace-nowrap">Publier un bien</span>
          </Link>
        </div>

        <p className="pt-1 text-sm text-foreground-muted">
          Publiez, modifiez et ajustez les tarifs et disponibilités de vos logements.
        </p>
      </header>

      {/* ── Filtres et affichage ───────────────────────────────────────────── */}

      <div className="flex flex-col justify-between gap-4 border-b border-border pb-3 sm:flex-row sm:items-center">

        <div role="tablist" aria-label="Filtrer par statut" className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => {
            const count = filter.id === 'ALL' ? (listings?.length ?? 0) : (counts.get(filter.id) ?? 0);
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-2 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-forest-600 bg-forest-600 text-neutral-0'
                    : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt hover:text-foreground',
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    'rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums',
                    isActive ? 'bg-white/20' : 'bg-background-alt',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="radiogroup"
          aria-label="Mode d’affichage"
          className="flex shrink-0 items-center gap-1 rounded-pill border border-border bg-background-card p-1"
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
                'flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors',
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

      {/* ── États ──────────────────────────────────────────────────────────── */}

      {actionError && (
        <div role="alert" className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-4 text-xs text-error-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          {actionError}
        </div>
      )}

      {error && (
        <div role="alert" className="space-y-2 rounded-card border border-error-500/20 bg-error-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-error-600" aria-hidden="true" />
          <p className="font-display text-sm font-semibold text-error-700">
            Impossible de charger vos annonces
          </p>
          <p className="text-xs text-error-700">
            Vérifiez votre connexion et rafraîchissez la page.
          </p>
        </div>
      )}

      {isLoading && (
        <div className={gridClass} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <OwnerListingSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* L'état vide s'affichait sans savoir qu'un filtre était actif : un
          propriétaire avec dix annonces cliquant sur « Rejetées » se voyait
          proposer de créer sa première annonce. */}
      {!isLoading && !error && filtered.length === 0 && (
        <OwnerListingsEmptyState hasFilter={activeFilter !== 'ALL'} />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className={gridClass}>
          {filtered.map((listing) => (
            <OwnerListingCard
              key={listing.id}
              listing={listing}
              viewMode={viewMode}
              onToggleStatus={(id, currentStatus) => toggleStatus.mutate({ id, currentStatus })}
              onToggleDerniereMinute={(id, active) => toggleDerniereMinute.mutate({ id, active })}
              onDelete={(id) => deleteListing.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}