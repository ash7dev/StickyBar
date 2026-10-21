'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { RevenuePeriod } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { useOwnerRevenue } from '@/features/owner-revenue/hooks/use-owner-revenue';
import { RevenueKpis } from '@/features/owner-revenue/components/RevenueKpis';
import { RevenueHistoryChart } from '@/features/owner-revenue/components/RevenueHistoryChart';
import { PayoutsTimeline, WalletSummaryCard } from '@/features/owner-revenue/components/WalletAndPayouts';
import { PerLogementTable } from '@/features/owner-revenue/components/PerLogementTable';
import { StatementCard } from '@/features/owner-revenue/components/StatementCard';
import { TransactionsCard } from '@/features/owner-revenue/components/TransactionsCard';

const PERIODS: Array<{ value: RevenuePeriod; label: string; comparison: string }> = [
  { value: 'month', label: 'Ce mois', comparison: 'vs mois précédent' },
  { value: 'quarter', label: '3 mois', comparison: 'vs 3 mois précédents' },
  { value: 'year', label: '12 mois', comparison: 'vs 12 mois précédents' },
];

/**
 * Revenus — tableau financier de l'hôte (Revenus + Wallet réunis) :
 * indicateurs, historique, solde, versements, performance par bien,
 * relevé mensuel exportable et historique des transactions.
 */
export default function OwnerRevenuePage() {
  const [period, setPeriod] = useState<RevenuePeriod>('month');
  const { data, isLoading, isError, error, refetch, isFetching } = useOwnerRevenue(period);
  const comparison = PERIODS.find((p) => p.value === period)!.comparison;

  return (
    <div className="space-y-5 pb-12">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex-[1_1_320px]">
          <p className="text-xs font-semibold tracking-[0.14em] text-foreground-muted">FINANCES</p>
          <h1 className="mt-1.5 font-display text-4xl font-semibold tracking-tight text-foreground">Revenus</h1>
        </div>
        <div role="group" aria-label="Période" className="flex gap-0.5 rounded-pill border border-border bg-background-card p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors',
                period === p.value ? 'bg-forest-950 text-neutral-50' : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <RevenueSkeleton />
      ) : isError || !data ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-background-card p-10 text-center">
          <AlertCircle className="h-8 w-8 text-error-500" aria-hidden="true" />
          <p className="text-sm text-foreground">{error instanceof Error ? error.message : 'Impossible de charger vos revenus.'}</p>
          <button type="button" onClick={() => refetch()} className="btn-ghost px-5 py-2.5 text-sm">
            Réessayer
          </button>
        </div>
      ) : (
        <div className={cn('space-y-5 transition-opacity', isFetching && 'opacity-70')}>
          <RevenueKpis data={data} comparisonLabel={comparison} />

          <div className="flex flex-wrap gap-5">
            <RevenueHistoryChart history={data.history} previousYear={data.historyPreviousYear} />
            <WalletSummaryCard wallet={data.wallet} />
          </div>

          <div className="flex flex-wrap gap-5">
            <PayoutsTimeline timeline={data.timeline} escrow={data.wallet.escrow} />
            <PerLogementTable logements={data.logements} />
          </div>

          <StatementCard history={data.history} />
          <TransactionsCard />
        </div>
      )}
    </div>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Chargement des revenus">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(270px,1fr))]">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[118px] animate-pulse rounded-[24px] bg-background-card/70" />
        ))}
      </div>
      <div className="flex flex-wrap gap-5">
        <div className="h-[360px] flex-[2_1_560px] animate-pulse rounded-[28px] bg-background-card/70" />
        <div className="h-[360px] flex-[1_1_320px] animate-pulse rounded-[28px] bg-background-card/70" />
      </div>
    </div>
  );
}
