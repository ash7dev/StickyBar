'use client';

import { Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type InspectionTypeFilter = 'ALL' | 'CHECKIN' | 'CHECKOUT' | 'DISPUTED';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: InspectionTypeFilter;
  onFilterChange: (filter: InspectionTypeFilter) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Toutes les pièces' },
  { id: 'SALON', label: 'Salon / Séjour' },
  { id: 'CUISINE', label: 'Cuisine & Équipements' },
  { id: 'CHAMBRE', label: 'Chambres' },
  { id: 'SALLE_DE_BAIN', label: 'Salle de bain' },
  { id: 'TERRASSE', label: 'Terrasse / Extérieur' },
  { id: 'COMPTEUR', label: 'Compteurs Électricité/Eau' },
];

export function GestionnaireEtatsDesLieuxFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  selectedCategory,
  onCategoryChange,
}: Props) {
  return (
    <div
      className="rounded-card border shadow-2xs p-4 sm:p-5 space-y-4"
      style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--foreground-muted)' }}
          />
          <input
            type="text"
            placeholder="Rechercher par logement, locataire, propriétaire ou code…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-pill border pl-10 pr-4 py-2.5 text-xs font-medium outline-none transition-colors bg-white [color-scheme:light]"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'Tous les rapports' },
            { id: 'CHECKIN', label: 'Check-in (Entrée)' },
            { id: 'CHECKOUT', label: 'Check-out (Sortie)' },
            { id: 'DISPUTED', label: 'Non-conformités' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id as InspectionTypeFilter)}
                className={cn(
                  'px-3.5 py-2 text-xs font-bold rounded-pill transition-all cursor-pointer',
                  isActive
                    ? 'bg-white text-forest-900 shadow-2xs border border-forest-200/80'
                    : 'bg-neutral-100/70 text-foreground-muted hover:text-foreground border border-transparent',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Second Row: Room Category Select */}
      <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 text-xs font-bold shrink-0" style={{ color: 'var(--forest-900)' }}>
          <Filter className="w-3.5 h-3.5 text-forest-600" />
          <span>Pièce / Zone :</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  'px-3 py-1 text-[0.7rem] font-bold rounded-pill transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-forest-900 text-lime-400 shadow-xs'
                    : 'bg-background-card text-foreground-muted hover:text-foreground border border-border',
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
