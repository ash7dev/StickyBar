'use client';

import type { ComponentType } from 'react';
import {
  AlertTriangle, ShieldAlert, UserX, Home, Sparkles, Download, Send, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type QuickFilterPreset =
  | 'ALL'
  | 'WITH_FAULTS'
  | 'UNVERIFIED_KYC'
  | 'BLOCKED'
  | 'HOSTS_WITH_LISTINGS'
  | 'NEW_USERS';

interface AdminUsersQuickFiltersProps {
  activePreset: QuickFilterPreset;
  onPresetSelect: (preset: QuickFilterPreset) => void;
  onExportCsv: () => void;
  onOpenBroadcast: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  /**
   * Nombre de comptes actuellement visés par la diffusion. Optionnel : les
   * appelants existants compilent sans changement, mais tant qu'il n'est pas
   * fourni le bouton reste muet sur sa portée — voir le commentaire plus bas.
   */
  nbDestinataires?: number;
  /** Effectif par raccourci, si l'appelant le connaît déjà. */
  compteurs?: Partial<Record<QuickFilterPreset, number>>;
}

/* Plus de `colorClass` par raccourci.
   Six pastilles vert / orange / rouge / violet côte à côte, plus une septième
   en vert plein pour l'état actif : la sélection ne se lisait plus. La couleur
   dit « ce filtre est appliqué », pas « ce filtre parle de KYC ». Au repos les
   chips sont neutres ; seule l'active est pleine.

   ⚠ `warning-300`, `warning-900`, `error-300`, `error-800` et `purple-*`
   n'existent pas dans globals.css : quatre chips sur six rendaient sans
   bordure ni couleur de texte. */

const PRESETS: Array<{
  key: QuickFilterPreset;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
    { key: 'ALL', label: 'Tous', Icon: Filter },
    { key: 'WITH_FAULTS', label: 'Comptes avec fautes', Icon: AlertTriangle },
    // `CheckCircle2` sur « Sans KYC vérifié » disait le contraire du filtre.
    { key: 'UNVERIFIED_KYC', label: 'Sans KYC vérifié', Icon: ShieldAlert },
    { key: 'BLOCKED', label: 'Comptes bloqués', Icon: UserX },
    { key: 'HOSTS_WITH_LISTINGS', label: 'Hôtes avec logements', Icon: Home },
    { key: 'NEW_USERS', label: 'Nouveaux inscrits', Icon: Sparkles },
  ];

const fmtNombre = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export function AdminUsersQuickFilters({
  activePreset,
  onPresetSelect,
  onExportCsv,
  onOpenBroadcast,
  hasActiveFilters,
  onClearFilters,
  nbDestinataires,
  compteurs,
}: AdminUsersQuickFiltersProps) {
  const boutonAction =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill px-3.5 text-xs font-semibold transition-colors';

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-background-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      {/* ── Raccourcis ─────────────────────────────────────────────────── */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <span className="eyebrow mr-1 flex shrink-0 items-center gap-1 text-[0.6875rem]">
          <Filter className="h-3.5 w-3.5" aria-hidden />
          Raccourcis
        </span>

        <div role="group" aria-label="Filtres rapides" className="flex items-center gap-2">
          {PRESETS.map(({ key, label, Icon }) => {
            const actif = activePreset === key;
            const n = compteurs?.[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={actif}
                onClick={() => onPresetSelect(key)}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-xs font-semibold transition-colors',
                  actif
                    ? 'border-forest-600 bg-forest-600 text-neutral-0'
                    : 'border-border bg-background-card text-foreground-muted hover:border-border-hover hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span>{label}</span>
                {n != null && (
                  <span
                    className={cn(
                      'tabular-nums',
                      actif ? 'text-neutral-0/75' : 'text-foreground-muted',
                    )}
                  >
                    {fmtNombre(n)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-1 shrink-0 text-xs font-semibold text-foreground-muted underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Actions globales ───────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-2 sm:border-t-0 sm:pt-0">
        <button
          type="button"
          onClick={onExportCsv}
          aria-label="Exporter la liste filtrée au format CSV"
          className={cn(
            boutonAction,
            'border border-border bg-background-card text-foreground hover:bg-background-alt',
          )}
        >
          <Download className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
          <span>Exporter CSV</span>
        </button>

        {/* Un envoi de masse doit annoncer sa portée sur le bouton qui le
            déclenche. « Diffusion Push » ne dit pas si l'on vise 12 ou 12 000
            personnes — et c'est justement ce qu'il faut savoir avant d'ouvrir
            le composeur. Tant que `nbDestinataires` n'est pas fourni, on
            garde un libellé qui n'affirme rien. */}
        <button
          type="button"
          onClick={onOpenBroadcast}
          aria-label={
            nbDestinataires != null
              ? `Rédiger une notification pour ${fmtNombre(nbDestinataires)} comptes`
              : 'Rédiger une notification pour la sélection courante'
          }
          className={cn(boutonAction, 'btn-primary h-8 px-3.5 text-xs')}
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          <span>
            Notifier
            {nbDestinataires != null && (
              <span className="tabular-nums"> {fmtNombre(nbDestinataires)} comptes</span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}