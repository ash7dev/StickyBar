'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface OwnerSearchFilterOptions {
  searchQuery: string;
  balanceFilter: 'ALL' | 'HAS_BALANCE' | 'ZERO_BALANCE';
}

interface Props {
  filters: OwnerSearchFilterOptions;
  onFilterChange: (updated: Partial<OwnerSearchFilterOptions>) => void;
  totalCount: number;
  hasBalanceCount: number;
}

export function GestionnaireProprietairesSearchFilterBar({
  filters,
  onFilterChange,
  totalCount,
  hasBalanceCount,
}: Props) {
  return (
    <div className="space-y-4 rounded-card border border-border bg-background-card p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" aria-hidden="true" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Rechercher par nom, prénom, téléphone ou email du propriétaire..."
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

        {/* Filtre par solde */}
        <div className="flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'ALL' as const, label: 'Tous', count: totalCount },
            { id: 'HAS_BALANCE' as const, label: 'Solde > 0 FCFA', count: hasBalanceCount },
            { id: 'ZERO_BALANCE' as const, label: 'Solde à 0 FCFA', count: totalCount - hasBalanceCount },
          ].map((tab) => {
            const isActive = filters.balanceFilter === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange({ balanceFilter: tab.id })}
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
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
