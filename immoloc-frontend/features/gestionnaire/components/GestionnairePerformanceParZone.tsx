'use client';

import { MapPin } from 'lucide-react';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface ZoneItem {
  zone: string;
  count: number;
  prixMoyen: number;
}

interface Props {
  zones: ZoneItem[];
  totalLogements: number;
}

export function GestionnairePerformanceParZone({ zones, totalLogements }: Props) {
  return (
    <div className="rounded-card border border-border bg-background-card p-7 sm:p-8 shadow-2xs space-y-6 h-full min-h-[320px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2.5">
              <MapPin className="h-6 w-6 text-forest-600" aria-hidden="true" />
              <span>Répartition par Zone Géographique</span>
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
              Communes phares et prix moyens par nuitée sous votre conciergerie
            </p>
          </div>

          <span className="inline-flex items-center rounded-pill bg-forest-50 text-forest-700 border border-forest-200/60 px-3.5 py-1.5 text-xs font-semibold">
            {zones.length} zone{zones.length > 1 ? 's' : ''}
          </span>
        </div>

        {zones.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="grid h-14 w-14 place-items-center rounded-inner bg-forest-50 text-forest-700 mx-auto">
              <MapPin className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-foreground">Aucune zone géographique enregistrée</p>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
              La ventilation par commune et les prix moyens par nuitée s&apos;afficheront au fur et à mesure de l&apos;ajout de vos annonces.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 pt-4">
            {zones.map((item) => {
              const pct = totalLogements > 0 ? Math.round((item.count / totalLogements) * 100) : 0;

              return (
                <div
                  key={item.zone}
                  className="flex items-center justify-between p-4 rounded-inner border border-border bg-background-alt hover:border-forest-600/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-10 w-10 place-items-center rounded-inner bg-forest-900 text-lime-400 font-bold text-xs">
                      <MapPin className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.zone}</p>
                      <p className="text-xs text-foreground-muted font-medium">
                        {item.count} logement{item.count > 1 ? 's' : ''} ({pct}%)
                      </p>
                    </div>
                  </div>

                  <div className="text-right tabular-nums">
                    <p className="text-sm font-bold text-forest-950">
                      {fcfa(item.prixMoyen)} <span className="text-xs font-normal text-foreground-muted">FCFA/nuit</span>
                    </p>
                    <span className="text-xs text-forest-700 font-medium">Prix moyen</span>
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
