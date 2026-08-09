'use client';

import { ShieldCheck, Search, RefreshCw, CheckCircle2, Clock, XCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminKycHeaderBarProps {
  activeTab: 'ALL' | 'EN_ATTENTE' | 'VERIFIE' | 'REJETE';
  onTabChange: (tab: 'ALL' | 'EN_ATTENTE' | 'VERIFIE' | 'REJETE') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  counts: {
    all: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

export function AdminKycHeaderBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  counts,
}: AdminKycHeaderBarProps) {
  return (
    <div className="space-y-4">
      {/* Haut : Titre + Action Rafraîchir */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-purple-50 border border-purple-200 text-purple-800 shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Vérification KYC & Pièces d'Identité
            </h1>
            <p className="text-xs text-foreground-muted">
              Approbation des pièces officielles (CNI, Passeport) et vérification faciale AI au Sénégal
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
          <span>Actualiser les dossiers</span>
        </button>
      </div>

      {/* Cartes de synthèse rapide */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onTabChange('ALL')}
          className={cn(
            'flex items-center justify-between rounded-card border p-3.5 text-left transition-colors',
            activeTab === 'ALL'
              ? 'border-purple-300 bg-purple-50/40 text-purple-900 shadow-2xs'
              : 'border-border bg-background-card hover:bg-background-alt',
          )}
        >
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Tous les dossiers</p>
            <p className="mt-0.5 font-display text-xl font-bold text-foreground">{counts.all}</p>
          </div>
          <Users className="h-5 w-5 text-foreground-muted" />
        </button>

        <button
          type="button"
          onClick={() => onTabChange('EN_ATTENTE')}
          className={cn(
            'flex items-center justify-between rounded-card border p-3.5 text-left transition-colors',
            activeTab === 'EN_ATTENTE'
              ? 'border-warning-300 bg-warning-50/40 text-warning-900 shadow-2xs'
              : 'border-border bg-background-card hover:bg-background-alt',
          )}
        >
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">En Attente</p>
            <p className="mt-0.5 font-display text-xl font-bold text-foreground">{counts.pending}</p>
          </div>
          <Clock className="h-5 w-5 text-warning-600" />
        </button>

        <button
          type="button"
          onClick={() => onTabChange('VERIFIE')}
          className={cn(
            'flex items-center justify-between rounded-card border p-3.5 text-left transition-colors',
            activeTab === 'VERIFIE'
              ? 'border-forest-300 bg-forest-50/40 text-forest-900 shadow-2xs'
              : 'border-border bg-background-card hover:bg-background-alt',
          )}
        >
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Vérifiés</p>
            <p className="mt-0.5 font-display text-xl font-bold text-foreground">{counts.verified}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-forest-600" />
        </button>

        <button
          type="button"
          onClick={() => onTabChange('REJETE')}
          className={cn(
            'flex items-center justify-between rounded-card border p-3.5 text-left transition-colors',
            activeTab === 'REJETE'
              ? 'border-error-300 bg-error-50/40 text-error-900 shadow-2xs'
              : 'border-border bg-background-card hover:bg-background-alt',
          )}
        >
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Rejetés</p>
            <p className="mt-0.5 font-display text-xl font-bold text-foreground">{counts.rejected}</p>
          </div>
          <XCircle className="h-5 w-5 text-error-600" />
        </button>
      </div>

      {/* Barre de Recherche */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom, prénom, email ou numéro de téléphone..."
          className="h-10 w-full rounded-pill border border-border bg-background-card pr-4 pl-10 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
