'use client';

import { useState } from 'react';
import { Calendar, Download, RefreshCw, Filter, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminDashboardHeaderBarProps {
  onRefresh?: () => void;
  onPeriodChange?: (period: string) => void;
  isRefreshing?: boolean;
}

export function AdminDashboardHeaderBar({
  onRefresh,
  onPeriodChange,
  isRefreshing,
}: AdminDashboardHeaderBarProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const periods = [
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: 'month', label: 'Ce mois-ci' },
    { id: 'year', label: 'Cette année' },
  ];

  const handlePeriodSelect = (periodId: string) => {
    setSelectedPeriod(periodId);
    onPeriodChange?.(periodId);
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-background-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
      {/* Salutation & Titre Opérationnel */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-lime-100 border border-lime-200 text-forest-800">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h2 className="font-display text-base font-semibold text-foreground sm:text-lg">
            Centre de Commandement Administrateur
          </h2>
        </div>
        <p className="text-xs text-foreground-muted">
          Supervision en temps réel des transactions, modérations et infrastructures de la plateforme Klef.
        </p>
      </div>

      {/* Barre d'actions & Filtres temporels (Responsive) */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Sélecteur de période */}
        <div className="flex items-center rounded-pill border border-border bg-background-alt p-1">
          {periods.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => handlePeriodSelect(period.id)}
              className={cn(
                'rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors duration-150 sm:px-3 sm:text-xs',
                selectedPeriod === period.id
                  ? 'bg-background-card text-forest-800 shadow-2xs'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Bouton Rafraîchir */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Actualiser les données"
          className="inline-flex h-9 w-9 items-center justify-center rounded-inner border border-border bg-background-alt text-foreground transition-colors hover:bg-background-card disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4 text-foreground-muted', isRefreshing && 'animate-spin')} />
        </button>

        {/* Bouton Exporter Rapport */}
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-pill bg-action px-3.5 text-xs font-semibold text-on-action shadow-action transition-all hover:bg-action-hover active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Exporter rapport</span>
          <span className="sm:hidden">Rapport</span>
        </button>
      </div>
    </div>
  );
}
