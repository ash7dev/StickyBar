'use client';

import { BarChart3, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RevenueMonth {
  month: string;
  volume: number;
  commission: number;
  count: number;
}

interface AdminRevenueChartProps {
  data?: RevenueMonth[];
  isLoading?: boolean;
}

function formatShortFcfa(amount: number) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return amount.toString();
}

export function AdminRevenueChart({ data = [], isLoading }: AdminRevenueChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  const maxVolume = Math.max(...data.map((d) => d.volume), 1);

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-xs sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-forest-700" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Aperçu des Revenus & Volumes
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Évolution mensuelle des réservations et commissions perçues par Klef
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-pill bg-forest-600" />
            <span className="text-foreground-muted">Volume brut (GMV)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-pill bg-lime-400 border border-lime-600" />
            <span className="text-foreground-muted">Commission (7%)</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
          <Info className="h-8 w-8 text-foreground-faint" />
          <p className="text-sm font-medium text-foreground">Aucune donnée temporelle disponible</p>
          <p className="text-xs text-foreground-muted">Les revenus s'afficheront dès qu'une réservation sera complétée.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 border-b border-border">
            {data.map((item) => {
              const heightPercent = Math.min(100, Math.max(12, Math.round((item.volume / maxVolume) * 100)));
              const commissionPercent = Math.min(100, Math.max(20, Math.round((item.commission / Math.max(item.volume, 1)) * 100)));

              return (
                <div key={item.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="relative w-full max-w-[48px] flex flex-col items-center justify-end rounded-t-inner bg-background-alt overflow-hidden transition-all duration-200 group-hover:bg-forest-50" style={{ height: `${heightPercent}%` }}>
                    {/* Volume Brut Fill */}
                    <div className="w-full bg-forest-700/80 transition-all group-hover:bg-forest-800" style={{ height: '100%' }} />
                    {/* Commission Fill Highlight */}
                    <div className="absolute bottom-0 w-full bg-lime-400 border-t border-lime-500" style={{ height: `${commissionPercent}%` }} />
                  </div>
                  <span className="text-[0.6875rem] font-semibold text-foreground-muted truncate">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 pt-2">
            {data.slice(-3).map((item) => (
              <div key={item.month} className="rounded-inner bg-background-alt/50 p-3 border border-border">
                <p className="text-[0.6875rem] font-semibold text-foreground-muted uppercase tracking-wider">{item.month}</p>
                <p className="mt-1 text-sm font-bold text-foreground">{item.volume.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-[0.6875rem] font-semibold text-forest-700">+{item.commission.toLocaleString('fr-FR')} FCFA comm.</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
