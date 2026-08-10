'use client';

import { useId, useMemo } from 'react';
import { BarChart3, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RevenueMonth {
  month: string;
  volume: number;
  commission: number;
  count: number;
}

interface Props {
  data?: RevenueMonth[];
  isLoading?: boolean;
}

const fcfa = (n: number) => Math.round(n).toLocaleString('fr-FR');

/** Abrégé pour l'axe : 1,2M / 850k / 420 */
function abrege(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(Math.round(amount));
}

export function AdminRevenueChart({ data = [], isLoading }: Props) {
  const titleId = useId();

  /* `Math.max(...data.map(...))` sur un tableau vide renvoie -Infinity.
     Le fallback `, 1` couvrait le cas, mais le calcul repartait à chaque
     rendu sur toute la série. */
  const { max, ticks, total } = useMemo(() => {
    const maxVolume = data.length ? Math.max(...data.map((d) => d.volume)) : 0;
    /* Arrondi à un palier lisible : sinon la graduation haute affiche
       « 1 847 320 FCFA », illisible sur un axe. */
    const magnitude = 10 ** Math.max(0, String(Math.round(maxVolume)).length - 2);
    const rounded = maxVolume > 0 ? Math.ceil(maxVolume / magnitude) * magnitude : 1;

    return {
      max: rounded,
      ticks: [1, 0.75, 0.5, 0.25, 0].map((r) => rounded * r),
      total: data.reduce(
        (acc, d) => ({
          volume: acc.volume + d.volume,
          commission: acc.commission + d.commission,
          count: acc.count + d.count,
        }),
        { volume: 0, commission: 0, count: 0 },
      ),
    };
  }, [data]);

  if (isLoading) {
    return <div className="h-80 animate-pulse rounded-card border border-border bg-background-alt" />;
  }

  return (
    <section
      aria-labelledby={titleId}
      className="space-y-6 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6"
    >
      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />
            <h2 id={titleId} className="font-display text-base font-semibold text-foreground">
              Revenus et volumes
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Évolution mensuelle des réservations et des commissions
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-forest-600" />
            <span className="text-foreground-muted">Volume brut</span>
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-gold-400" />
            <span className="text-foreground-muted">Commission</span>
          </span>
        </div>
      </header>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-2 p-8 text-center">
          <Info className="h-8 w-8 text-foreground-muted opacity-40" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">Aucune donnée disponible</p>
          <p className="text-xs text-foreground-muted">
            Les revenus s’afficheront dès la première réservation finalisée.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Graphique ────────────────────────────────────────────────── */}

          <div className="flex gap-3">
            {/* Axe vertical : sans lui, les hauteurs relatives ne se
                traduisaient en aucun montant. */}
            <div className="flex h-56 w-14 shrink-0 flex-col justify-between py-1 text-right">
              {ticks.map((t) => (
                <span key={t} className="text-xs tabular-nums text-foreground-muted">
                  {abrege(t)}
                </span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              {/* Lignes de repère */}
              <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
                {ticks.map((t) => (
                  <span key={t} className="h-px w-full bg-border" />
                ))}
              </div>

              <ul className="relative flex h-56 items-end gap-3 sm:gap-4">
                {data.map((item) => {
                  /* Les deux barres partagent la même échelle : la
                     comparaison visuelle est enfin exacte. */
                  const hVolume = (item.volume / max) * 100;
                  const hCommission = (item.commission / max) * 100;
                  const taux = item.volume > 0
                    ? ((item.commission / item.volume) * 100).toFixed(1).replace('.', ',')
                    : '0';

                  return (
                    <li key={item.month} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                      <div className="flex h-full items-end justify-center gap-1">
                        <div
                          className="w-full max-w-[22px] rounded-t-[4px] bg-forest-600 transition-colors group-hover:bg-forest-700"
                          style={{ height: `${Math.max(hVolume, 0.5)}%` }}
                        />
                        <div
                          className="w-full max-w-[22px] rounded-t-[4px] bg-gold-400 transition-colors group-hover:bg-gold-500"
                          style={{ height: `${Math.max(hCommission, 0.5)}%` }}
                        />
                      </div>

                      {/* Infobulle : les montants exacts n'étaient nulle part,
                          sauf pour les trois derniers mois. */}
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-inner border border-border bg-background-card px-3 py-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                      >
                        <p className="text-xs font-semibold text-foreground">{item.month}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
                          <span aria-hidden="true" className="h-2 w-2 rounded-[2px] bg-forest-600" />
                          <span className="tabular-nums text-foreground">{fcfa(item.volume)}</span> FCFA
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                          <span aria-hidden="true" className="h-2 w-2 rounded-[2px] bg-gold-400" />
                          <span className="tabular-nums text-foreground">{fcfa(item.commission)}</span> FCFA
                          <span className="tabular-nums">({taux} %)</span>
                        </p>
                        <p className="mt-1 border-t border-border pt-1 text-xs tabular-nums text-foreground-muted">
                          {item.count} réservation{item.count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* `grid-cols-6` en dur : avec huit mois de données, deux
                  colonnes disparaissaient silencieusement. */}
              <div className="mt-2 flex gap-3 sm:gap-4">
                {data.map((item) => (
                  <span
                    key={item.month}
                    className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-foreground-muted"
                  >
                    {item.month}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Totaux ───────────────────────────────────────────────────── */}

          <dl className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
            {[
              { label: 'Volume total', value: `${fcfa(total.volume)} FCFA`, tone: 'text-foreground' },
              { label: 'Commission perçue', value: `${fcfa(total.commission)} FCFA`, tone: 'text-gold-700' },
              { label: 'Réservations', value: String(total.count), tone: 'text-foreground' },
            ].map(({ label, value, tone }) => (
              <div key={label} className="rounded-inner border border-border bg-background-alt p-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  {label}
                </dt>
                <dd className={cn('mt-1 font-display text-lg font-semibold tabular-nums', tone)}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}