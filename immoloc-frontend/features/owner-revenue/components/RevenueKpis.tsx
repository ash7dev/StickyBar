import type { OwnerRevenueResponse, RevenueMetrics } from '@/lib/nestjs';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { monthLong, percent } from '@/features/owner-home/lib/format';

interface Kpi {
  label: string;
  value: string;
  /** Variation affichée ; null si non calculable */
  delta: string | null;
  trend: 'up' | 'down' | 'flat';
  /** Valeurs des 12 derniers mois pour le mini-diagramme */
  series: number[];
}

function pctDelta(current: number, previous: number): { delta: string | null; trend: Kpi['trend'] } {
  if (previous <= 0) return { delta: current > 0 ? 'Nouveau' : null, trend: current > 0 ? 'up' : 'flat' };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { delta: `${pct > 0 ? '+' : ''}${pct} %`, trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

function buildKpis(current: RevenueMetrics, previous: RevenueMetrics, history: OwnerRevenueResponse['history']): Kpi[] {
  const pointsDiff = Math.round((current.occupancy.rate - previous.occupancy.rate) * 100);
  const nightsDiff = current.nightsSold - previous.nightsSold;
  return [
    {
      label: 'Revenu net',
      value: formatFCFA(current.revenueNet),
      ...pctDelta(current.revenueNet, previous.revenueNet),
      series: history.map((m) => m.revenueNet),
    },
    {
      label: 'Nuits vendues',
      value: String(current.nightsSold),
      delta: previous.nightsSold > 0 || nightsDiff ? `${nightsDiff > 0 ? '+' : ''}${nightsDiff}` : null,
      trend: nightsDiff > 0 ? 'up' : nightsDiff < 0 ? 'down' : 'flat',
      series: history.map((m) => m.nightsSold),
    },
    {
      label: 'Taux d’occupation',
      value: percent(current.occupancy.rate),
      delta: previous.occupancy.availableNights > 0 ? `${pointsDiff > 0 ? '+' : ''}${pointsDiff} pts` : null,
      trend: pointsDiff > 0 ? 'up' : pointsDiff < 0 ? 'down' : 'flat',
      series: history.map((m) => m.occupancy.rate),
    },
    {
      label: 'Revenu net / nuit',
      value: current.netPerNight !== null ? formatFCFA(current.netPerNight) : '—',
      ...(current.netPerNight !== null && previous.netPerNight !== null
        ? pctDelta(current.netPerNight, previous.netPerNight)
        : { delta: null, trend: 'flat' as const }),
      series: history.map((m) => m.netPerNight ?? 0),
    },
  ];
}

const TREND_STYLE = {
  up: { pill: 'bg-success-50 text-success-700', last: 'bg-forest-600', base: 'bg-forest-100' },
  down: { pill: 'bg-error-50 text-error-700', last: 'bg-error-500', base: 'bg-error-50' },
  flat: { pill: 'bg-neutral-100 text-neutral-600', last: 'bg-forest-600', base: 'bg-forest-100' },
} as const;

/** 4 indicateurs : chiffre et variation à gauche, mini-diagramme 12 mois à droite. */
export function RevenueKpis({ data, comparisonLabel }: { data: OwnerRevenueResponse; comparisonLabel: string }) {
  const kpis = buildKpis(data.current, data.previous, data.history);
  const firstMonth = data.history[0]?.month;
  const lastMonth = data.history.at(-1)?.month;

  return (
    <section aria-label="Chiffres clés" className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(270px,1fr))]">
      {kpis.map((kpi) => {
        const style = TREND_STYLE[kpi.trend];
        const max = Math.max(...kpi.series, 0);
        return (
          <article key={kpi.label} className="flex flex-col gap-2.5 rounded-[24px] border border-border/70 bg-background-card px-5 py-5">
            <h2 className="text-[13px] text-foreground-muted">{kpi.label}</h2>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="whitespace-nowrap font-display text-[clamp(1.5rem,2.1vw,1.9rem)] font-semibold leading-tight text-foreground">
                  {kpi.value}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  {kpi.delta ? (
                    <span className={cn('rounded-pill px-2 py-0.5 font-bold', style.pill)}>{kpi.delta}</span>
                  ) : (
                    <span className="rounded-pill bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-600">—</span>
                  )}
                  <span className="text-foreground-muted">{comparisonLabel}</span>
                </p>
              </div>
              <div
                className="flex h-12 shrink-0 items-end gap-[3px]"
                role="img"
                aria-label={`${kpi.label} de ${firstMonth ? monthLong(firstMonth) : ''} à ${lastMonth ? monthLong(lastMonth) : ''}`}
              >
                {kpi.series.map((v, i) => (
                  <span
                    key={i}
                    className={cn('w-1.5 rounded-[2px]', i === kpi.series.length - 1 ? style.last : style.base)}
                    style={{ height: `${max > 0 ? Math.max((v / max) * 100, 6) : 6}%` }}
                  />
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
