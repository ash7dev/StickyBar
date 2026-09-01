'use client';

import { Building2, TreePine, BedDouble, Home, PieChart } from 'lucide-react';

interface Item {
  type: string;
  count: number;
  label: string;
}

interface Props {
  data: Item[];
  totalLogements: number;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  VILLA: TreePine,
  APPARTEMENT: Building2,
  CHAMBRE: BedDouble,
  AUTRES: Home,
};

export function GestionnaireRepartitionsChart({ data, totalLogements }: Props) {
  return (
    <div className="rounded-card border border-border bg-background-card p-7 sm:p-8 shadow-2xs space-y-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <PieChart className="h-5 w-5 text-forest-600" aria-hidden="true" />
              <span>Répartition du Parc</span>
            </h3>
            <p className="text-xs text-foreground-muted mt-1 font-medium">
              Typologie des logements sous conciergerie
            </p>
          </div>

          <span className="inline-flex items-center rounded-pill bg-forest-50 text-forest-700 border border-forest-200/60 px-3 py-1 text-xs font-semibold">
            {totalLogements} logement{totalLogements > 1 ? 's' : ''}
          </span>
        </div>

        {data.length === 0 ? (
          <p className="text-xs text-center text-foreground-muted py-8">
            Aucune donnée de typologie disponible.
          </p>
        ) : (
          <div className="space-y-4 pt-4">
            {data.map((item) => {
              const pct = totalLogements > 0 ? Math.round((item.count / totalLogements) * 100) : 0;
              const Icon = TYPE_ICONS[item.type] || Home;

              return (
                <div key={item.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="grid h-7 w-7 place-items-center rounded-inner bg-forest-50 text-forest-700">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="text-foreground">{item.count} bien{item.count > 1 ? 's' : ''}</span>
                      <span className="text-forest-700">({pct}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-neutral-100 h-2 rounded-pill overflow-hidden">
                    <div
                      className="bg-forest-600 h-full rounded-pill transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
