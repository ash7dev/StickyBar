'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Check, LayoutGrid, List, AlertCircle, Plus } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { OwnerListingCard, OwnerListing } from '@/features/listings/components/owner/OwnerListingCard';
import { OwnerListingSkeleton } from '@/features/listings/components/owner/OwnerListingSkeleton';
import { OwnerListingsEmptyState } from '@/features/listings/components/owner/OwnerListingsEmptyState';

const FILTERS = [
  { id: 'ALL',            label: 'Toutes'      },
  { id: 'PUBLISHED',      label: 'Publiées'    },
  { id: 'PENDING_REVIEW', label: 'En révision' },
  { id: 'DRAFT',          label: 'Brouillons'  },
  { id: 'PAUSED',         label: 'En pause'    },
  { id: 'REJECTED',       label: 'Rejetées'    },
];

export default function AnnoncesPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const queryClient = useQueryClient();

  const { data: listings, isLoading, error } = useQuery<OwnerListing[]>({
    queryKey: ['listings', 'mine'],
    queryFn: () => nestFetch<OwnerListing[]>(NEST_API.LISTINGS.LIST_MINE),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const endpoint = currentStatus === 'PUBLISHED'
        ? NEST_API.LISTINGS.PAUSE(id)
        : NEST_API.LISTINGS.RESUME(id);
      return nestFetch(endpoint, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
    },
  });

  const toggleDerniereMinuteMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return nestFetch(NEST_API.LISTINGS.UPDATE(id), {
        method: 'PATCH',
        body: JSON.stringify({ derniereMinuteActive: active }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
    },
  });

  const filtered = listings?.filter((l) =>
    activeFilter === 'ALL' ? true : l.statut === activeFilter
  );

  const filtersWithCount = FILTERS.map((f) => ({
    ...f,
    count: f.id === 'ALL'
      ? (listings?.length ?? 0)
      : (listings?.filter((l) => l.statut === f.id).length ?? 0),
  }));

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header de la Page ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="eyebrow block mb-1">Propriétés & Hébergements</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">
              Mes Annonces
            </h1>
          </div>

          {/* Bouton Publier un bien aligné à DROITE */}
          <Link
            href="/dashboard/annonces/nouvelle"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-black text-xs transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-forest-950 stroke-[3px]" />
            <span className="whitespace-nowrap">Publier un bien</span>
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-foreground-muted font-medium pt-1">
          Publiez, modifiez et ajustez les tarifs et disponibilités de vos logements.
        </p>
      </div>

      {/* ── Control Bar: Filter Tabs + View Mode Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {filtersWithCount.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-pill text-xs transition-all shrink-0 font-extrabold ${
                  isActive
                    ? 'bg-forest-950 text-lime-400 shadow-md'
                    : 'bg-background-card border border-border/80 text-foreground-muted hover:bg-background-alt hover:text-forest-950'
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-pill text-[10px] font-black ${
                    isActive ? 'bg-lime-400 text-forest-950' : 'bg-background-alt text-foreground-muted'
                  }`}
                >
                  {filter.count}
                </span>
                {isActive && <Check className="w-3.5 h-3.5 text-lime-400" />}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: Grid vs List (Défaut: Liste) */}
        <div className="flex items-center gap-1 p-1 bg-background-card border border-border/80 rounded-pill shrink-0 shadow-2xs">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-pill text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-forest-950 text-lime-400 shadow-2xs'
                : 'text-foreground-muted hover:text-forest-950'
            }`}
            title="Vue Liste Horizontale"
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Liste</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-pill text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-forest-950 text-lime-400 shadow-2xs'
                : 'text-foreground-muted hover:text-forest-950'
            }`}
            title="Vue Grille"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Grille</span>
          </button>
        </div>

      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-card p-6 text-center text-error-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-error-600 mx-auto" />
          <p className="font-display text-sm font-bold">Impossible de charger vos annonces</p>
          <p className="text-xs text-error-600">Veuillez vérifier votre connexion ou réactualiser la page.</p>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
          {[...Array(6)].map((_, i) => (
            <OwnerListingSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !error && filtered?.length === 0 && (
        <OwnerListingsEmptyState />
      )}

      {/* ── Grid / List Display ── */}
      {!isLoading && !error && filtered && filtered.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
          {filtered.map((listing) => (
            <OwnerListingCard
              key={listing.id}
              listing={listing}
              viewMode={viewMode}
              onToggleStatus={(id, currentStatus) => toggleStatusMutation.mutate({ id, currentStatus })}
              onToggleDerniereMinute={(id, active) => toggleDerniereMinuteMutation.mutate({ id, active })}
            />
          ))}
        </div>
      )}

    </div>
  );
}
