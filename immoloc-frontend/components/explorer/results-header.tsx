'use client';

import { ArrowUpDown, ChevronDown } from 'lucide-react';
import type { SearchFilters } from '@/lib/explorer/filters-schema';
import { TRI_VALUES } from '@/lib/explorer/filters-schema';

interface ResultsHeaderProps {
  total: number;
  filters: SearchFilters;
}

/**
 * En-tête de résultats ultra-premium avec compte compact et tri chip (1 seule ligne)
 */
export function ResultsHeader({ total, filters }: ResultsHeaderProps) {
  // Sécurise total
  const count = typeof total === 'number' && total >= 0 ? total : 0;

  return (
    <div className="flex flex-row items-center justify-between gap-3 mb-4 sm:mb-6">
      {/* Compte de résultats compact */}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-sm sm:text-lg font-bold text-foreground truncate">
          {count > 0 ? (
            <>
              {count.toLocaleString('fr-FR')} {count > 1 ? 'logements' : 'logement'}
              {filters.ville ? (
                <span className="text-foreground-muted font-medium ml-1">
                  à {filters.ville}
                </span>
              ) : (
                <span className="text-foreground-muted font-medium ml-1">
                  disponible{count > 1 ? 's' : ''}
                </span>
              )}
            </>
          ) : (
            <>
              0 logement disponible
              {filters.ville && (
                <span className="text-foreground-muted font-medium ml-1">
                  à {filters.ville}
                </span>
              )}
            </>
          )}
        </h1>
      </div>

      {/* Tri Chip Premium — Visible uniquement si résultats */}
      {count > 0 && (
        <div className="relative shrink-0">
          <div className="relative flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-forest-700 dark:text-forest-400" aria-hidden="true" />
            <select
              id="sort-select"
              aria-label="Trier les résultats"
              value={filters.tri || 'pertinence'}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                params.set('tri', e.target.value);
                params.set('page', '1');
                window.history.replaceState(null, '', `?${params.toString()}`);
                window.location.reload();
              }}
              className="appearance-none rounded-pill border border-border bg-background-card py-1.5 pl-8 pr-7 text-xs font-semibold text-foreground hover:border-forest-400 focus:border-forest-600 focus:outline-none transition-colors cursor-pointer shadow-2xs"
            >
              {TRI_VALUES.map((value) => (
                <option key={value} value={value}>
                  {getTriLabel(value)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-foreground-muted" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Libellés des options de tri
 */
function getTriLabel(value: string): string {
  const labels: Record<string, string> = {
    pertinence: 'Pertinence',
    prix_asc: 'Prix croissant',
    prix_desc: 'Prix décroissant',
    note_desc: 'Mieux notés',
    recent: 'Plus récents',
  };
  return labels[value] || value;
}

