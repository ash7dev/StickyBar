'use client';

import { ShieldAlert, UserX, Home, Sparkles, Download, Send, Filter, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type QuickFilterPreset = 'ALL' | 'WITH_FAULTS' | 'UNVERIFIED_KYC' | 'BLOCKED' | 'HOSTS_WITH_LISTINGS' | 'NEW_USERS';

interface AdminUsersQuickFiltersProps {
  activePreset: QuickFilterPreset;
  onPresetSelect: (preset: QuickFilterPreset) => void;
  onExportCsv: () => void;
  onOpenBroadcast: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const PRESETS: Array<{ key: QuickFilterPreset; label: string; Icon: typeof Filter; colorClass: string }> = [
  { key: 'ALL', label: 'Tous', Icon: Filter, colorClass: 'border-border bg-background-card text-foreground' },
  { key: 'WITH_FAULTS', label: 'Comptes avec fautes', Icon: ShieldAlert, colorClass: 'border-warning-300 bg-warning-50 text-warning-900 font-semibold' },
  { key: 'UNVERIFIED_KYC', label: 'Sans KYC vérifié', Icon: CheckCircle2, colorClass: 'border-error-300 bg-error-50 text-error-800 font-semibold' },
  { key: 'BLOCKED', label: 'Comptes Bloqués', Icon: UserX, colorClass: 'border-error-300 bg-error-50 text-error-800 font-semibold' },
  { key: 'HOSTS_WITH_LISTINGS', label: 'Hôtes avec Logements', Icon: Home, colorClass: 'border-forest-300 bg-forest-50 text-forest-900 font-semibold' },
  { key: 'NEW_USERS', label: 'Nouveaux inscrits', Icon: Sparkles, colorClass: 'border-purple-300 bg-purple-50 text-purple-900 font-semibold' },
];

export function AdminUsersQuickFilters({
  activePreset,
  onPresetSelect,
  onExportCsv,
  onOpenBroadcast,
  hasActiveFilters,
  onClearFilters,
}: AdminUsersQuickFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-card border border-border bg-background-card p-3 shadow-2xs">
      {/* Chips de filtres rapides */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted shrink-0 flex items-center gap-1 mr-1">
          <Filter className="h-3.5 w-3.5" /> Raccourcis :
        </span>
        {PRESETS.map(({ key, label, Icon, colorClass }) => {
          const isSelected = activePreset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPresetSelect(key)}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-xs transition-all',
                isSelected
                  ? 'border-forest-500 bg-forest-700 text-neutral-0 font-bold shadow-xs'
                  : `${colorClass} hover:bg-background-alt`,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-foreground-muted underline hover:text-foreground shrink-0 ml-1"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Actions globales : Export CSV & Broadcast */}
      <div className="flex items-center gap-2 shrink-0 justify-end border-t border-border pt-2 sm:border-t-0 sm:pt-0">
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex h-8 items-center gap-1.5 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
          title="Exporter la liste filtrée au format CSV"
        >
          <Download className="h-3.5 w-3.5 text-foreground-muted" />
          <span>Exporter CSV</span>
        </button>

        <button
          type="button"
          onClick={onOpenBroadcast}
          className="inline-flex h-8 items-center gap-1.5 rounded-inner bg-forest-700 px-3 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors"
          title="Envoyer un message de notification à la sélection"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Diffusion Push</span>
        </button>
      </div>
    </div>
  );
}
