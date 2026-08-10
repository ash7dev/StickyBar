'use client';

import { Users, Search, RefreshCw, UserCheck, ShieldAlert, Home, UserX, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type UserTabFilter = 'ALL' | 'PROPRIETAIRE' | 'LOCATAIRE' | 'BLOQUE' | 'KYC_ATTENTE';

interface AdminUsersHeaderBarProps {
  activeTab: UserTabFilter;
  onTabChange: (tab: UserTabFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statutKycFilter: string;
  onStatutKycChange: (kyc: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  counts: {
    total: number;
    proprietaires: number;
    locataires: number;
    bloques: number;
    kycAttente: number;
  };
}

const TABS: Array<{
  key: UserTabFilter;
  label: string;
  countKey: keyof AdminUsersHeaderBarProps['counts'];
  Icon: typeof Users;
  activeClasses: string;
}> = [
  { key: 'ALL', label: 'Tous les Comptes', countKey: 'total', Icon: Users, activeClasses: 'border-purple-300 bg-purple-50/40 shadow-2xs' },
  { key: 'PROPRIETAIRE', label: 'Hôtes & Proprios', countKey: 'proprietaires', Icon: Home, activeClasses: 'border-forest-300 bg-forest-50/40 shadow-2xs' },
  { key: 'LOCATAIRE', label: 'Locataires', countKey: 'locataires', Icon: UserCheck, activeClasses: 'border-blue-300 bg-blue-50/40 shadow-2xs' },
  { key: 'BLOQUE', label: 'Comptes Bloqués', countKey: 'bloques', Icon: UserX, activeClasses: 'border-error-300 bg-error-50/40 shadow-2xs' },
  { key: 'KYC_ATTENTE', label: 'KYC En Attente', countKey: 'kycAttente', Icon: Clock, activeClasses: 'border-warning-300 bg-warning-50/40 shadow-2xs' },
];

export function AdminUsersHeaderBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  statutKycFilter,
  onStatutKycChange,
  onRefresh,
  isRefreshing = false,
  counts,
}: AdminUsersHeaderBarProps) {
  return (
    <div className="space-y-4">
      {/* Header Title & Refresh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800 shadow-2xs">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Gestion des Utilisateurs & Hôtes
            </h1>
            <p className="text-xs text-foreground-muted">
              Supervision des comptes, vérification KYC, gestion des hôtes et modération des accès
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

      {/* KPI Count Cards */}
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

      {/* Filters & Search Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom, prénom, email ou numéro de téléphone..."
            className="h-10 w-full rounded-pill border border-border bg-background-card pr-4 pl-10 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
          />
        </div>

        {/* KYC Status Select */}
        <select
          value={statutKycFilter}
          onChange={(e) => onStatutKycChange(e.target.value)}
          className="h-10 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground focus:border-forest-500 focus:outline-none"
        >
          <option value="">Tous les statuts KYC</option>
          <option value="VERIFIE">KYC Vérifié</option>
          <option value="EN_ATTENTE">KYC En attente</option>
          <option value="REJETE">KYC Rejeté</option>
          <option value="NON_VERIFIE">KYC Non vérifié</option>
          <option value="A_RENOUVELER">KYC À renouveler</option>
        </select>
      </div>
    </div>
  );
}
