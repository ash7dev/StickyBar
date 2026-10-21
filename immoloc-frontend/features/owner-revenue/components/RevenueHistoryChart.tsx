import type { OwnerRevenueResponse } from '@/lib/nestjs';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { monthLong, monthShort } from '@/features/owner-home/lib/format';

/** Revenu net des 12 derniers mois (barres) et même mois un an plus tôt (ligne pointillée). */
export function RevenueHistoryChart({
  history,
  previousYear,
}: {
  history: OwnerRevenueResponse['history'];
  previousYear: OwnerRevenueResponse['historyPreviousYear'];
}) {
  const max = Math.max(...history.map((m) => m.revenueNet), ...previousYear.map((m) => m.revenueNet), 1);
  const hasPreviousYear = previousYear.some((m) => m.revenueNet > 0);
  // Points de la ligne N-1, au centre de chaque colonne (coordonnées en % de la zone)
  const points = previousYear
    .map((m, i) => `${((i + 0.5) / previousYear.length) * 100},${100 - (m.revenueNet / max) * 100}`)
    .join(' ');

  return (
    <section
      aria-labelledby="revenue-history"
      className="flex min-w-0 flex-[2_1_560px] flex-col gap-5 rounded-[28px] border border-border/70 bg-background-card p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="revenue-history" className="text-[15px] font-bold text-foreground">
          Évolution sur 12 mois
        </h2>
        <ul className="flex gap-4 text-xs text-foreground-muted" aria-label="Légende">
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-forest-600" aria-hidden="true" />
            Revenu net
          </li>
          {hasPreviousYear && (
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-gold-400" aria-hidden="true" />
              Année précédente
            </li>
          )}
        </ul>
      </div>

      <div className="relative h-60">
        <ol className="absolute inset-0 flex items-end gap-2.5" aria-label="Revenu net par mois">
          {history.map((m, i) => {
            const isCurrent = i === history.length - 1;
            return (
              <li key={m.month} className="flex h-full flex-1 items-end">
                <span className="sr-only">
                  {monthLong(m.month)} : {formatFCFA(m.revenueNet)}
                </span>
                <div
                  aria-hidden="true"
                  title={`${monthLong(m.month)} · ${formatFCFA(m.revenueNet)}`}
                  className={cn('w-full rounded-lg transition-colors', isCurrent ? 'bg-forest-600' : 'bg-forest-100 hover:bg-forest-200')}
                  style={{ height: `${Math.max((m.revenueNet / max) * 100, 2)}%` }}
                />
              </li>
            );
          })}
        </ol>
        {hasPreviousYear && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <polyline points={points} fill="none" stroke="var(--gold-400)" strokeWidth="2.5" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>

      <div className="flex gap-2.5 text-center text-[11px] text-foreground-muted" aria-hidden="true">
        {history.map((m, i) => (
          <span key={m.month} className={cn('flex-1', i === history.length - 1 && 'font-bold text-forest-700')}>
            {monthShort(m.month)}
          </span>
        ))}
      </div>
    </section>
  );
}
