'use client';

import { Download, Sparkles, AlertTriangle, Zap, Percent, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type LogementQuickFilterPreset =
  | 'ALL'
  | 'INSTANT_BOOKING'
  | 'WITH_DEPOSIT'
  | 'FEATURED'
  | 'FLAGGED';

interface AdminLogementsQuickFiltersProps {
  activePreset: LogementQuickFilterPreset;
  onPresetSelect: (preset: LogementQuickFilterPreset) => void;
  onExportCsv: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const PRESETS: Array<{ key: LogementQuickFilterPreset; label: string; Icon: typeof Sparkles }> = [
  { key: 'ALL', label: 'Tous les critères', Icon: SlidersHorizontal },
  { key: 'INSTANT_BOOKING', label: 'Réservation Instantanée', Icon: Zap },
  { key: 'WITH_DEPOSIT', label: 'Acompte 30%', Icon: Percent },
  { key: 'FEATURED', label: 'En Vedette', Icon: Sparkles },
  { key: 'FLAGGED', label: 'Non-conformités signalées', Icon: AlertTriangle },
];

export function AdminLogementsQuickFilters({
  activePreset,
  onPresetSelect,
  onExportCsv,
  hasActiveFilters,
  onClearFilters,
}: AdminLogementsQuickFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {PRESETS.map(({ key, label, Icon }) => {
          const isActive = activePreset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPresetSelect(key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'border-forest-600 bg-forest-600 text-neutral-0 shadow-2xs'
                  : 'border-border bg-background-card text-foreground hover:bg-background-alt',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-neutral-0' : 'text-foreground-muted')} />
              <span>{label}</span>
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-error-600 hover:text-error-700 underline underline-offset-2 ml-1"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Export CSV */}
      <button
        type="button"
        onClick={onExportCsv}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
      >
        <Download className="h-4 w-4 text-foreground-muted" />
        <span>Exporter le catalogue CSV</span>
      </button>
    </div>
  );
}
