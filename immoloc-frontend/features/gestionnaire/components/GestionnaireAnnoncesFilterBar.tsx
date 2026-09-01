'use client';

import { Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;
  sortBy: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'TITLE';
}

interface Props {
  filters: FilterOptions;
  onFilterChange: (updated: Partial<FilterOptions>) => void;
  statusCounts: Map<string, number>;
  totalCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const STATUT_TABS = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'PUBLISHED', label: 'Publiées' },
  { id: 'PENDING_REVIEW', label: 'En révision' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'PAUSED', label: 'En pause' },
  { id: 'REJECTED', label: 'Rejetées' },
] as const;

export function GestionnaireAnnoncesFilterBar({
  filters,
  onFilterChange,
  statusCounts,
  totalCount,
  viewMode,
  onViewModeChange,
}: Props) {
  return (
    <div className="space-y-4 rounded-card border border-border bg-background-card p-4 sm:p-5 shadow-2xs">
      {/* Ligne 1 : Recherche + Tri + Mode d'affichage */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" aria-hidden="true" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Rechercher par nom de logement, ville ou propriétaire..."
            className="w-full rounded-field border border-border bg-background-alt pl-10 pr-4 py-2.5 text-xs sm:text-sm text-foreground focus:border-forest-600 focus:outline-none placeholder:text-foreground-muted font-medium"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted hover:text-foreground font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tri & Affichage */}
        <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
          {/* Sélecteur de tri */}
          <div className="flex items-center gap-1.5 rounded-field border border-border bg-background-alt px-3 py-2 text-xs font-semibold">
            <SlidersHorizontal className="h-3.5 w-3.5 text-forest-600 shrink-0" aria-hidden="true" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="NEWEST">Plus récents</option>
              <option value="PRICE_ASC">Prix : croissant</option>
              <option value="PRICE_DESC">Prix : décroissant</option>
              <option value="TITLE">Titre A-Z</option>
            </select>
          </div>

          {/* Bascule Grille / Liste */}
          <div
            role="radiogroup"
            aria-label="Mode d’affichage"
            className="flex items-center gap-1 rounded-pill border border-border bg-background-alt p-1"
          >
            {[
              { mode: 'grid' as const, icon: LayoutGrid, label: 'Grille' },
              { mode: 'list' as const, icon: List, label: 'Liste' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={viewMode === mode}
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  'flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  viewMode === mode
                    ? 'bg-forest-900 text-neutral-0 shadow-xs'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ligne 2 : Onglets par Statut */}
      <div
        role="tablist"
        aria-label="Filtrer par statut"
        className="no-scrollbar flex items-center gap-2 overflow-x-auto pt-2 border-t border-border/60"
      >
        {STATUT_TABS.map((tab) => {
          const count = tab.id === 'ALL' ? totalCount : statusCounts.get(tab.id) ?? 0;
          const isActive = filters.statusFilter === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange({ statusFilter: tab.id })}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer',
                isActive
                  ? 'border-forest-700 bg-forest-900 text-neutral-0 shadow-xs'
                  : 'border-border bg-background-alt text-foreground-muted hover:bg-neutral-100 hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-pill px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums',
                  isActive ? 'bg-white/20 text-white' : 'bg-background-card text-foreground',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
