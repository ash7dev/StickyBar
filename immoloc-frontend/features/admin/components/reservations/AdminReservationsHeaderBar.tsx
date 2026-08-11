'use client';

import { CalendarDays, Search, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ReservationStatusTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

interface AdminReservationsHeaderBarProps {
  activeTab: ReservationStatusTab;
  onTabChange: (tab: ReservationStatusTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  counts: {
    all: number;
    pending: number;
    confirmed: number;
    checkedIn: number;
    completed: number;
    cancelled: number;
  };
}

const TABS: Array<{
  key: ReservationStatusTab;
  label: string;
  countKey: keyof AdminReservationsHeaderBarProps['counts'];
  Icon: typeof CalendarDays;
  activeClasses: string;
}> = [
  { key: 'ALL', label: 'Toutes', countKey: 'all', Icon: CalendarDays, activeClasses: 'border-border bg-background-alt text-foreground shadow-xs' },
  { key: 'PENDING', label: 'En attente', countKey: 'pending', Icon: Clock, activeClasses: 'border-warning-500/30 bg-warning-50 text-warning-900 shadow-xs' },
  { key: 'CONFIRMED', label: 'Confirmées', countKey: 'confirmed', Icon: CheckCircle2, activeClasses: 'border-forest-200 bg-forest-50 text-forest-900 shadow-xs' },
  { key: 'CHECKED_IN', label: 'En séjour', countKey: 'checkedIn', Icon: CheckCheck, activeClasses: 'border-info-500/30 bg-info-50 text-info-900 shadow-xs' },
  { key: 'COMPLETED', label: 'Terminées', countKey: 'completed', Icon: CheckCircle2, activeClasses: 'border-border bg-background-alt text-foreground shadow-xs' },
  { key: 'CANCELLED', label: 'Annulées', countKey: 'cancelled', Icon: XCircle, activeClasses: 'border-error-500/30 bg-error-50 text-error-900 shadow-xs' },
];

export function AdminReservationsHeaderBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  counts,
}: AdminReservationsHeaderBarProps) {
  return (
    <div className="space-y-4">
      {/* Title + Refresh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800 shadow-2xs">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Supervision & Contrôle des Réservations
            </h1>
            <p className="text-xs text-foreground-muted">
              Suivi des réservations de la plateforme, commissions, paiements et annulations administratives
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

      {/* KPI Cards */}
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

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par ID réservation, locataire, propriétaire ou titre du logement..."
          className="h-10 w-full rounded-pill border border-border bg-background-card pr-4 pl-10 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
