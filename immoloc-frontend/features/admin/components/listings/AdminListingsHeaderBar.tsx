'use client';

import { Building2, Search, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ListingStatusTab = 'ALL' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';

interface AdminListingsHeaderBarProps {
  activeTab: ListingStatusTab;
  onTabChange: (tab: ListingStatusTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  counts: {
    all: number;
    pendingReview: number;
    published: number;
    rejected: number;
    suspended: number;
  };
}

const TABS: Array<{ key: ListingStatusTab; label: string; countKey: keyof AdminListingsHeaderBarProps['counts']; Icon: typeof Clock; activeClasses: string }> = [
  { key: 'ALL', label: 'Toutes', countKey: 'all', Icon: Building2, activeClasses: 'border-purple-300 bg-purple-50/40 shadow-2xs' },
  { key: 'PENDING_REVIEW', label: 'En attente', countKey: 'pendingReview', Icon: Clock, activeClasses: 'border-warning-300 bg-warning-50/40 shadow-2xs' },
  { key: 'PUBLISHED', label: 'Publiées', countKey: 'published', Icon: CheckCircle2, activeClasses: 'border-forest-300 bg-forest-50/40 shadow-2xs' },
  { key: 'REJECTED', label: 'Rejetées', countKey: 'rejected', Icon: XCircle, activeClasses: 'border-error-300 bg-error-50/40 shadow-2xs' },
  { key: 'SUSPENDED', label: 'Suspendues', countKey: 'suspended', Icon: AlertTriangle, activeClasses: 'border-warning-300 bg-warning-50/40 shadow-2xs' },
];

export function AdminListingsHeaderBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  counts,
}: AdminListingsHeaderBarProps) {
  return (
    <div className="space-y-4">
      {/* Titre + Rafraîchir */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Modération du Catalogue d&apos;Annonces
            </h1>
            <p className="text-xs text-foreground-muted">
              Validation, suspension et mise en vedette des logements publiés sur Klef
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-foreground-muted', isRefreshing && 'animate-spin')} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes de compteurs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TABS.map(({ key, label, countKey, Icon, activeClasses }) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={cn(
              'flex items-center justify-between rounded-card border p-3 text-left transition-colors',
              activeTab === key
                ? activeClasses
                : 'border-border bg-background-card hover:bg-background-alt',
            )}
          >
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">{label}</p>
              <p className="mt-0.5 font-display text-xl font-bold text-foreground">{counts[countKey]}</p>
            </div>
            <Icon className="h-5 w-5 text-foreground-muted" />
          </button>
        ))}
      </div>

      {/* Barre de Recherche */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par titre, ville, nom du propriétaire ou email…"
          className="h-10 w-full rounded-pill border border-border bg-background-card pr-4 pl-10 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
