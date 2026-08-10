'use client';

import { Star, Search, RefreshCw, SlidersHorizontal, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ReviewRatingFilter = 'ALL' | 'CRITICAL' | 'NEUTRAL' | 'EXCELLENT';
export type ReviewTypeFilter = 'ALL' | 'SUR_LOGEMENT' | 'SUR_LOCATAIRE' | 'SUR_PROPRIETAIRE';

interface AdminReviewsHeaderBarProps {
  activeRatingFilter: ReviewRatingFilter;
  onRatingFilterChange: (filter: ReviewRatingFilter) => void;
  activeTypeFilter: ReviewTypeFilter;
  onTypeFilterChange: (type: ReviewTypeFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalCount: number;
}

export function AdminReviewsHeaderBar({
  activeRatingFilter,
  onRatingFilterChange,
  activeTypeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  totalCount,
}: AdminReviewsHeaderBarProps) {
  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Modération des Avis & Notes
          </h1>
          <p className="text-xs text-foreground-muted">
            Supervision et modération des évaluations laissées par les voyageurs et les hôtes ({totalCount} avis répertoriés).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Rating Filters */}
          <button
            type="button"
            onClick={() => onRatingFilterChange('ALL')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-all',
              activeRatingFilter === 'ALL'
                ? 'border-forest-600 bg-forest-600 text-neutral-0 shadow-2xs'
                : 'border-border bg-background-card text-foreground hover:bg-background-alt',
            )}
          >
            <span>Toutes les notes</span>
          </button>

          <button
            type="button"
            onClick={() => onRatingFilterChange('CRITICAL')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-all',
              activeRatingFilter === 'CRITICAL'
                ? 'border-error-600 bg-error-50 text-error-900 font-bold border-error-300'
                : 'border-border bg-background-card text-foreground hover:bg-background-alt',
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-error-600" />
            <span>Avis critiques (1 à 2 étoiles)</span>
          </button>

          <button
            type="button"
            onClick={() => onRatingFilterChange('EXCELLENT')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-all',
              activeRatingFilter === 'EXCELLENT'
                ? 'border-gold-500 bg-gold-50 text-gold-900 font-bold border-gold-300'
                : 'border-border bg-background-card text-foreground hover:bg-background-alt',
            )}
          >
            <Star className="h-3.5 w-3.5 text-gold-500 fill-gold-400" />
            <span>5 Étoiles</span>
          </button>

          {/* Type Filter Select */}
          <select
            value={activeTypeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as ReviewTypeFilter)}
            className="h-8 rounded-pill border border-border bg-background-card px-3 text-xs font-semibold text-foreground focus:border-forest-600 focus:outline-hidden"
          >
            <option value="ALL">Tous les types d'avis</option>
            <option value="SUR_LOGEMENT">Sur le logement</option>
            <option value="SUR_LOCATAIRE">Sur le locataire</option>
            <option value="SUR_PROPRIETAIRE">Sur l'hôte</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher dans les commentaires..."
            className="h-9 w-full rounded-pill border border-border bg-background-card pl-9 pr-4 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-600 focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
