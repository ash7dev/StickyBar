'use client';

import { Building2, Search, RefreshCw, CheckCircle2, Clock, XCircle, AlertTriangle, Star, Building } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type LogementCatalogTab = 'ALL' | 'PUBLISHED' | 'PENDING_REVIEW' | 'SUSPENDED' | 'REJECTED' | 'FEATURED';

interface AdminLogementsHeaderBarProps {
  activeTab: LogementCatalogTab;
  onTabChange: (tab: LogementCatalogTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  counts: {
    all: number;
    published: number;
    pendingReview: number;
    suspended: number;
    rejected: number;
    featured: number;
  };
}

const TABS: Array<{
  key: LogementCatalogTab;
  label: string;
  countKey: keyof AdminLogementsHeaderBarProps['counts'];
  Icon: typeof Building2;
  activeClasses: string;
}> = [
  { key: 'ALL', label: 'Tous les biens', countKey: 'all', Icon: Building2, activeClasses: 'border-purple-300 bg-purple-50/40 shadow-2xs' },
  { key: 'PUBLISHED', label: 'Publiés & Actifs', countKey: 'published', Icon: CheckCircle2, activeClasses: 'border-forest-300 bg-forest-50/40 shadow-2xs' },
  { key: 'PENDING_REVIEW', label: 'En Modération', countKey: 'pendingReview', Icon: Clock, activeClasses: 'border-warning-300 bg-warning-50/40 shadow-2xs' },
  { key: 'FEATURED', label: 'En Vedette', countKey: 'featured', Icon: Star, activeClasses: 'border-gold-300 bg-gold-50/40 shadow-2xs' },
  { key: 'SUSPENDED', label: 'Suspendus', countKey: 'suspended', Icon: AlertTriangle, activeClasses: 'border-error-300 bg-error-50/40 shadow-2xs' },
  { key: 'REJECTED', label: 'Rejetés', countKey: 'rejected', Icon: XCircle, activeClasses: 'border-error-300 bg-error-50/40 shadow-2xs' },
];

export function AdminLogementsHeaderBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onRefresh,
  isRefreshing = false,
  counts,
}: AdminLogementsHeaderBarProps) {
  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Gestion du Parc Immobilier & Catalogues
            </h1>
            <p className="text-xs text-foreground-muted">
              Inventaire complet de tous les logements de la plateforme, gestion des vedettes et suivi de disponibilité
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
          <span>Actualiser le catalogue</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
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

      {/* Search & Type Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par titre de bien, ville, quartier, ou nom de l'hôte..."
            className="h-10 w-full rounded-pill border border-border bg-background-card pr-4 pl-10 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="h-10 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground focus:border-forest-500 focus:outline-none"
        >
          <option value="">Tous les types de biens</option>
          <option value="APPARTEMENT">Appartements</option>
          <option value="VILLA">Villas</option>
          <option value="STUDIO">Studios</option>
          <option value="MAISON">Maisons</option>
          <option value="CHAMBRE">Chambres privées</option>
        </select>
      </div>
    </div>
  );
}
