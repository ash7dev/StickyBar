import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import type { OwnerOverviewResponse } from '@/lib/nestjs';
import { monthLong, monthShort } from '../lib/format';
import { Tile, TileTitle } from './Tile';

/** Revenus nets des 6 derniers mois, par mois d'arrivée des séjours. */
export function RevenueTile({ revenue }: { revenue: OwnerOverviewResponse['revenue'] }) {
  const max = Math.max(...revenue.monthly.map((m) => m.revenue), 1);
  const current = revenue.monthly[revenue.monthly.length - 1];
  const change = revenue.changePct;

  return (
    <Tile span={2} labelledBy="home-revenue">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TileTitle id="home-revenue">Revenus nets · {monthLong(current.month)}</TileTitle>
          <p className="mt-1.5 whitespace-nowrap font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-semibold leading-none tracking-tight text-foreground">
            {formatFCFA(revenue.currentMonth)}
          </p>
          <p className="mt-2 text-xs text-foreground-muted">
            {current.stays} séjour{current.stays > 1 ? 's' : ''} arrivant ce mois-ci
          </p>
        </div>
        {change !== null && (
          <span
            className={cn(
              'shrink-0 rounded-pill px-2.5 py-1 text-xs font-bold',
              change >= 0 ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700',
            )}
          >
            {change >= 0 ? '+' : ''}
            {change} % vs {monthShort(revenue.monthly[revenue.monthly.length - 2].month)}
          </span>
        )}
      </div>

      <ol className="mt-auto flex h-40 items-end gap-3" aria-label="Revenus des six derniers mois">
        {revenue.monthly.map((m, i) => {
          const isCurrent = i === revenue.monthly.length - 1;
          const isPrevious = i === revenue.monthly.length - 2;
          return (
            <li key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="sr-only">
                {monthLong(m.month)} : {formatFCFA(m.revenue)}
              </span>
              <div
                aria-hidden="true"
                title={`${monthLong(m.month)} · ${formatFCFA(m.revenue)}`}
                className={cn(
                  'w-full rounded-xl transition-colors',
                  isCurrent ? 'bg-forest-600' : isPrevious ? 'bg-forest-200' : 'bg-neutral-200',
                )}
                style={{ height: `${Math.max((m.revenue / max) * 100, 4)}%` }}
              />
              <span
                aria-hidden="true"
                className={cn('text-[11px]', isCurrent ? 'font-bold text-forest-700' : 'text-foreground-muted')}
              >
                {monthShort(m.month)}
              </span>
            </li>
          );
        })}
      </ol>
    </Tile>
  );
}
