'use client';

import { TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface Props {
  data: Array<{
    mois: string;
    ca: number;
    netProprietaire: number;
    commissionKlef: number;
  }>;
}

export function GestionnaireRevenueChart({ data }: Props) {
  const hasData = data.some((d) => d.ca > 0);
  const maxCa = Math.max(...data.map((d) => d.ca), 100000);

  return (
    <div className="rounded-card border border-border bg-background-card p-7 sm:p-8 shadow-2xs h-full flex flex-col justify-between min-h-[460px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-forest-600" aria-hidden="true" />
            <span>Historique des Réservations & Net Propriétaires</span>
          </h3>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Ventilation entre le volume payé par les voyageurs, le net revenant aux propriétaires et la commission Klef
          </p>
        </div>

        {hasData && (
          <div className="flex items-center gap-5 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-forest-600 inline-block" />
              <span className="text-foreground">Net Propriétaires</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-lime-400 inline-block border border-forest-900" />
              <span className="text-foreground">Commission Klef</span>
            </div>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="grid h-16 w-16 place-items-center rounded-inner bg-forest-50 text-forest-700 mx-auto">
            <BarChart3 className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-foreground">
            Aucun chiffre d&apos;affaires enregistré pour le moment
          </p>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            Le suivi graphique des réservations et des reversements s&apos;affichera automatiquement dès les premières réservations confirmées.
          </p>
        </div>
      ) : (
        /* Visualisation Barres Dynamiques Réhaussée */
        <div className="flex-1 flex items-end">
          <div className="grid grid-cols-6 gap-4 items-end w-full h-full min-h-[220px] pt-8 pb-3">
            {data.map((d, i) => {
              const heightPct = Math.max(12, Math.round((d.ca / maxCa) * 100));
              const isCurrentMonth = i === data.length - 1;

              return (
                <div key={d.mois} className="flex flex-col items-center gap-3 h-full justify-end group relative">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-forest-950 text-neutral-50 text-xs p-2.5 rounded-inner shadow-xl pointer-events-none z-30 whitespace-nowrap text-center">
                    <p className="font-bold">{d.mois}</p>
                    <p>Volume: {fcfa(d.ca)} FCFA</p>
                    <p className="text-lime-400">Net Propriétaires: {fcfa(d.netProprietaire)} FCFA</p>
                    <p className="text-forest-200">Commission Klef: {fcfa(d.commissionKlef)} FCFA</p>
                  </div>

                  {/* Barre Principale CA plus large et haute */}
                  <div className="w-full max-w-[54px] bg-neutral-100 rounded-t-inner relative overflow-hidden flex flex-col justify-end transition-all group-hover:bg-forest-100" style={{ height: `${heightPct}%` }}>
                    <div
                      className={cn(
                        'w-full transition-all duration-500 rounded-t-inner',
                        isCurrentMonth ? 'bg-forest-950' : 'bg-forest-600',
                      )}
                      style={{ height: '100%' }}
                    />
                    {/* Bande supérieure commission Klef */}
                    <div
                      className="w-full bg-lime-400 transition-all duration-500 absolute top-0"
                      style={{ height: '12%' }}
                    />
                  </div>

                  <span className={cn('text-xs sm:text-sm font-semibold mt-1', isCurrentMonth ? 'text-forest-900 font-bold' : 'text-foreground-muted')}>
                    {d.mois}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
