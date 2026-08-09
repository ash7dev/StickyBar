'use client';

import { MapPin, Navigation, Inbox } from 'lucide-react';

export interface CityDistribution {
  ville: string;
  count: number;
  percentage: number;
}

interface AdminGeographicStatsProps {
  cities?: CityDistribution[];
  isLoading?: boolean;
}

export function AdminGeographicStats({ cities = [], isLoading = false }: AdminGeographicStatsProps) {
  if (isLoading) {
    return (
      <div className="h-52 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-xs sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <MapPin className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Répartition Géographique au Sénégal
            </h2>
            <p className="text-xs text-foreground-muted">
              Distribution du catalogue de logements par région et zone touristique
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-forest-700">{cities.length} zone{cities.length > 1 ? 's' : ''}</span>
      </div>

      {cities.length > 0 ? (
        <div className="space-y-3">
          {cities.map((city) => (
            <div key={city.ville} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Navigation className="h-3.5 w-3.5 text-forest-700 shrink-0" />
                  <span className="font-semibold text-foreground truncate">{city.ville}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-foreground-muted">{city.count} annonce{city.count > 1 ? 's' : ''} ({city.percentage}%)</span>
                </div>
              </div>

              <div className="h-2 w-full rounded-pill bg-background-alt overflow-hidden">
                <div
                  className="h-full rounded-pill bg-forest-600 transition-all duration-300"
                  style={{ width: `${Math.max(4, city.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-background-alt text-foreground-muted">
            <Inbox className="h-5 w-5" />
          </span>
          <p className="text-xs font-semibold text-foreground">Aucune donnée géographique</p>
          <p className="text-[0.75rem] text-foreground-muted">Aucun logement répertorié dans les régions pour le moment.</p>
        </div>
      )}
    </div>
  );
}
