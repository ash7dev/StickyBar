'use client';

import type { SearchFilters } from '@/lib/explorer/filters-schema';
import { TRI_VALUES } from '@/lib/explorer/filters-schema';

interface ResultsHeaderProps {
  total: number;
  filters: SearchFilters;
}

/**
 * En-tête de résultats avec compte et tri
 * Gère gracieusement les cas 0 résultats, erreurs, etc.
 */
export function ResultsHeader({ total, filters }: ResultsHeaderProps) {
  // Sécurise total
  const count = typeof total === 'number' && total >= 0 ? total : 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      {/* Compte de résultats */}
      <div>
        {count > 0 && (
          <h1 className="text-lg sm:text-xl font-semibold text-forest-900">
            {count.toLocaleString('fr-FR')} {count > 1 ? 'logements disponibles' : 'logement disponible'}
            {filters.ville && (
              <span className="text-foreground-muted font-normal ml-1">
                à {filters.ville}
              </span>
            )}
          </h1>
        )}
      </div>

      {/* Tri - Visible uniquement si résultats */}
      {count > 0 && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="sort-select"
            className="text-sm font-medium text-foreground-muted whitespace-nowrap"
          >
            Trier par
          </label>
          <select
            id="sort-select"
            value={filters.tri || 'pertinence'}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              params.set('tri', e.target.value);
              // Garder page à 1 quand on change le tri
              params.set('page', '1');
              window.history.replaceState(null, '', `?${params.toString()}`);
              window.location.reload(); // Force re-fetch côté serveur
            }}
            className="px-3 py-2 text-sm font-medium bg-white border border-border rounded-pill text-forest-900 hover:border-forest-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer"
          >
            {TRI_VALUES.map((value) => (
              <option key={value} value={value}>
                {getTriLabel(value)}
              </option>
            ))}
          </select>
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
