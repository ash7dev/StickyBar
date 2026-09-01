'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertCircle, Building2, Plus } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { OwnerListingCard, OwnerListing } from '@/features/listings/components/owner/OwnerListingCard';
import { OwnerListingSkeleton } from '@/features/listings/components/owner/OwnerListingSkeleton';
import { GestionnaireAnnoncesStatsHeader } from '@/features/gestionnaire/components/GestionnaireAnnoncesStatsHeader';
import { GestionnaireAnnoncesFilterBar, FilterOptions } from '@/features/gestionnaire/components/GestionnaireAnnoncesFilterBar';

export default function GestionnaireAnnoncesPage() {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    statusFilter: 'ALL',
    sortBy: 'NEWEST',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: listings, isLoading, error } = useQuery<OwnerListing[]>({
    queryKey: ['listings', 'gestionnaire'],
    queryFn: () => nestFetch<OwnerListing[]>(NEST_API.GESTIONNAIRE.LOGEMENTS),
  });

  const invalidate = useCallback(() => {
    setActionError(null);
    queryClient.invalidateQueries({ queryKey: ['listings', 'gestionnaire'] });
  }, [queryClient]);

  const toggleStatus = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) =>
      nestFetch(
        currentStatus === 'PUBLISHED' ? NEST_API.LISTINGS.PAUSE(id) : NEST_API.LISTINGS.RESUME(id),
        { method: 'PATCH' },
      ),
    onSuccess: invalidate,
    onError: (e) =>
      setActionError(
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
    onError: (e) =>
      setActionError(
        e instanceof Error && e.message ? e.message : 'La dernière minute n’a pas pu être modifiée.',
      ),
  });

  const deleteListing = useMutation({
    mutationFn: (id: string) => nestFetch(NEST_API.LISTINGS.ARCHIVE(id), { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: (e) =>
      setActionError(
        e instanceof Error && e.message ? e.message : 'La suppression de l’annonce n’a pas abouti.',
      ),
  });

  const handleFilterChange = (updated: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  // Filtrage et Tri combiné
  const { filtered, counts } = useMemo(() => {
    const all = listings ?? [];
    const byStatus = new Map<string, number>();
    all.forEach((l) => byStatus.set(l.statut, (byStatus.get(l.statut) ?? 0) + 1));

    let result = [...all];

    // 1. Filtre statut
    if (filters.statusFilter !== 'ALL') {
      result = result.filter((l) => l.statut === filters.statusFilter);
    }

    // 2. Recherche textuelle (titre, ville, propriétaire)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((l) => {
        const titleMatch = l.titre.toLowerCase().includes(q);
        const cityMatch = (l.ville || '').toLowerCase().includes(q);
        const ownerMatch = (l as any).proprietaire
          ? `${(l as any).proprietaire.prenom} ${(l as any).proprietaire.nom}`.toLowerCase().includes(q)
          : false;
        return titleMatch || cityMatch || ownerMatch;
      });
    }

    // 3. Tri
    result.sort((a, b) => {
      if (filters.sortBy === 'PRICE_ASC') return Number(a.prixBase || a.prixParNuit || 0) - Number(b.prixBase || b.prixParNuit || 0);
      if (filters.sortBy === 'PRICE_DESC') return Number(b.prixBase || b.prixParNuit || 0) - Number(a.prixBase || a.prixParNuit || 0);
      if (filters.sortBy === 'TITLE') return a.titre.localeCompare(b.titre);
      // NEWEST
      const dateA = new Date((a as any).creeLe || a.createdAt || 0).getTime();
      const dateB = new Date((b as any).creeLe || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return {
      filtered: result,
      counts: byStatus,
    };
  }, [listings, filters]);

  const gridClass =
    viewMode === 'grid'
      ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
      : 'space-y-4';

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. En-tête de la page ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Annonces sous Conciergerie
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Gérez, publiez et modifiez les logements placés sous mandat par vos propriétaires partenaires.
          </p>
        </div>

        <Link
          href="/gestionnaire/annonces/nouvelle"
          className="btn-action inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Publier un bien conciergerie</span>
        </Link>
      </div>

      {/* ── 2. Bannière de synthèse KPI ─────────────────────────────────── */}
      {listings && <GestionnaireAnnoncesStatsHeader listings={listings} />}

      {/* ── 3. Barre de filtre, recherche et tri ──────────────────────────── */}
      <GestionnaireAnnoncesFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        statusCounts={counts}
        totalCount={listings?.length ?? 0}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* ── Erreurs d'action ───────────────────────────────────────────── */}
      {actionError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-card border border-error-500/20 bg-error-50 p-4 text-xs text-error-700 font-medium"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="space-y-2 rounded-card border border-error-500/20 bg-error-50 p-6 text-center"
        >
          <AlertCircle className="mx-auto h-8 w-8 text-error-600" aria-hidden="true" />
          <p className="font-display text-sm font-semibold text-error-700">
            Impossible de charger les annonces sous gestion
          </p>
          <p className="text-xs text-error-700">
            Vérifiez votre connexion et rafraîchissez la page.
          </p>
        </div>
      )}

      {/* ── Chargement Skeleton ────────────────────────────────────────── */}
      {isLoading && (
        <div className={gridClass} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <OwnerListingSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* ── État vide ─────────────────────────────────────────────────── */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center shadow-xs space-y-3">
          <div className="mx-auto w-12 h-12 rounded-inner bg-forest-50 text-forest-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            {filters.searchQuery || filters.statusFilter !== 'ALL'
              ? 'Aucune annonce ne correspond à votre recherche'
              : 'Aucune annonce conciergerie enregistrée pour le moment'}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            {filters.searchQuery || filters.statusFilter !== 'ALL'
              ? 'Essayez de modifier vos critères de recherche ou de réinitialiser le filtre de statut.'
              : 'Commencez par ajouter le premier logement sous votre conciergerie.'}
          </p>
          {filters.searchQuery || filters.statusFilter !== 'ALL' ? (
            <button
              type="button"
              onClick={() => setFilters({ searchQuery: '', statusFilter: 'ALL', sortBy: 'NEWEST' })}
              className="inline-flex items-center justify-center px-4 py-2 rounded-pill bg-neutral-100 text-foreground text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          ) : (
            <Link
              href="/gestionnaire/annonces/nouvelle"
              className="btn-action inline-flex items-center justify-center gap-2 mt-4 px-6 py-3 text-xs sm:text-sm font-semibold"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Publier un premier bien</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Grille / Liste des logements ───────────────────────────────── */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className={gridClass}>
          {filtered.map((listing) => (
            <OwnerListingCard
              key={listing.id}
              listing={listing}
              viewMode={viewMode}
              isGestionnaire={true}
              onToggleStatus={(id, currentStatus) =>
                toggleStatus.mutate({ id, currentStatus })
              }
              onToggleDerniereMinute={(id, active) =>
                toggleDerniereMinute.mutate({ id, active })
              }
              onDelete={(id) => deleteListing.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
