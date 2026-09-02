'use client';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Grid2x2, ListFilter, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type PlanningViewMode = 'gantt' | 'checkins' | 'calendar';

export interface PlanningFilterOptions {
  searchQuery: string;
  selectedLogementId: string;
  currentDate: Date;
}

interface Props {
  filters: PlanningFilterOptions;
  onFilterChange: (updated: Partial<PlanningFilterOptions>) => void;
  viewMode: PlanningViewMode;
  onViewModeChange: (mode: PlanningViewMode) => void;
  logementsList: Array<{ id: string; titre: string; ville?: string }>;
}

export function GestionnairePlanningFilterBar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  logementsList,
}: Props) {
  const monthName = filters.currentDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const handlePrevMonth = () => {
    const prev = new Date(filters.currentDate);
    prev.setMonth(prev.getMonth() - 1);
    onFilterChange({ currentDate: prev });
  };

  const handleNextMonth = () => {
    const next = new Date(filters.currentDate);
    next.setMonth(next.getMonth() + 1);
    onFilterChange({ currentDate: next });
  };

  const handleToday = () => {
    onFilterChange({ currentDate: new Date() });
  };

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* 1. Navigateur de mois */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-pill border border-border bg-background-alt p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-pill text-foreground hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-forest-900 min-w-[130px] text-center">
              {capitalizedMonth}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-pill text-foreground hover:bg-neutral-200 transition-colors cursor-pointer"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-2 rounded-pill border border-border bg-background-card hover:bg-neutral-100 text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            Aujourd'hui
          </button>
        </div>

        {/* 2. Filtres & Recherche */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-xl">
          {/* Input recherche */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-faint" aria-hidden="true" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Rechercher bien, locataire, bailleur..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-pill border border-border bg-background-card text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-forest-600 transition-colors"
            />
          </div>

          {/* Selector logement avec fond blanc éclatant */}
          <select
            value={filters.selectedLogementId}
            onChange={(e) => onFilterChange({ selectedLogementId: e.target.value })}
            className="w-full sm:w-auto text-xs sm:text-sm rounded-pill border border-border bg-white text-neutral-900 px-3.5 py-2 font-semibold focus:outline-none focus:border-forest-600 transition-colors cursor-pointer shadow-2xs [color-scheme:light]"
          >
            <option value="ALL" className="bg-white text-neutral-900 py-1">Tous les logements ({logementsList.length})</option>
            {logementsList.map((l) => (
              <option key={l.id} value={l.id} className="bg-white text-neutral-900 py-1">
                {l.titre} {l.ville ? `(${l.ville})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Modes de vue */}
        <div className="flex items-center rounded-pill border border-border bg-background-alt p-1 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('gantt')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-pill transition-all cursor-pointer',
              viewMode === 'gantt'
                ? 'bg-background-card text-forest-900 shadow-2xs border border-border/60'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <Grid2x2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('checkins')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-pill transition-all cursor-pointer',
              viewMode === 'checkins'
                ? 'bg-background-card text-forest-900 shadow-2xs border border-border/60'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <ListFilter className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Flux Arrivées/Départs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
