'use client';

import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatutItem {
  statut: string;
  label: string;
  count: number;
  color: string;
}

interface Props {
  statuts: StatutItem[];
  totalLogements: number;
}

export function GestionnaireStatutsAnnoncesChart({ statuts, totalLogements }: Props) {
  return (
    <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-forest-600" aria-hidden="true" />
            <span>Maturité du Parc & Statuts</span>
          </h3>
          <p className="text-xs text-foreground-muted mt-1 font-medium">
            Répartition des logements selon leur état d&apos;activation
          </p>
        </div>

        <span className="inline-flex items-center rounded-pill bg-forest-50 text-forest-700 border border-forest-200/60 px-3 py-1 text-xs font-semibold">
          {totalLogements} bien{totalLogements > 1 ? 's' : ''}
        </span>
      </div>

      {totalLogements === 0 ? (
        <p className="text-xs text-center text-foreground-muted py-6">
          Aucun bien sous gestion enregistrée.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Barre empilée globale */}
          <div className="w-full h-3 rounded-pill bg-neutral-100 flex overflow-hidden">
            {statuts.map((item) => {
              const pct = totalLogements > 0 ? (item.count / totalLogements) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={item.statut}
                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                  className="h-full transition-all duration-500"
                  title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Grille de détail des statuts */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {statuts.map((item) => {
              const pct = totalLogements > 0 ? Math.round((item.count / totalLogements) * 100) : 0;

              return (
                <div
                  key={item.statut}
                  className="flex items-center justify-between p-3 rounded-inner border border-border bg-background-alt"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 tabular-nums text-xs font-bold shrink-0">
                    <span className="text-foreground">{item.count}</span>
                    <span className="text-foreground-muted text-[0.6875rem]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
