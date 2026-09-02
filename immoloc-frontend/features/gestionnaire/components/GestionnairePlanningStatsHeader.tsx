'use client';

import { ArrowDownLeft, ArrowUpRight, Calendar, Key, Percent } from 'lucide-react';

interface Props {
  checkinsTodayCount: number;
  checkoutsTodayCount: number;
  activeStaysCount: number;
  occupancyRate: number;
}

export function GestionnairePlanningStatsHeader({
  checkinsTodayCount,
  checkoutsTodayCount,
  activeStaysCount,
  occupancyRate,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Arrivées du jour */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Arrivées du jour (Check-in)</span>
          <div className="w-9 h-9 rounded-pill bg-success-50 text-success-700 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {checkinsTodayCount}
          </p>
          <span className="text-xs font-semibold text-success-700 bg-success-50 border border-success-500/20 px-2 py-0.5 rounded-pill">
            Aujourd'hui
          </span>
        </div>
      </div>

      {/* 2. Départs du jour */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Départs du jour (Check-out)</span>
          <div className="w-9 h-9 rounded-pill bg-warning-50 text-warning-700 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {checkoutsTodayCount}
          </p>
          <span className="text-xs font-semibold text-warning-700 bg-warning-50 border border-warning-500/20 px-2 py-0.5 rounded-pill">
            Aujourd'hui
          </span>
        </div>
      </div>

      {/* 3. Séjours en cours */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Séjours en cours</span>
          <div className="w-9 h-9 rounded-pill bg-forest-50 text-forest-700 flex items-center justify-center">
            <Key className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {activeStaysCount}
          </p>
          <span className="text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-pill">
            Occupés
          </span>
        </div>
      </div>

      {/* 4. Taux d'occupation */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Taux d'occupation moyen</span>
          <div className="w-9 h-9 rounded-pill bg-gold-50 text-gold-700 flex items-center justify-center">
            <Percent className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-forest-900 tabular-nums">
            {Math.round(occupancyRate)}%
          </p>
          <span className="text-xs font-semibold text-gold-800 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-pill">
            Ce mois
          </span>
        </div>
      </div>
    </div>
  );
}
