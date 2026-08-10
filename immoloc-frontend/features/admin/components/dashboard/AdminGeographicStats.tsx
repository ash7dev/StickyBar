'use client';

import { useMemo } from 'react';
import { MapPin, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CityDistribution {
  ville: string;
  count: number;
  percentage: number;
}

interface Props {
  cities?: CityDistribution[];
  isLoading?: boolean;
}

export function AdminGeographicStats({ cities = [], isLoading = false }: Props) {
  const { sorted, maxPct, total } = useMemo(() => {
    /* Rien ne garantissait l'ordre : une zone à 3 % pouvait s'afficher
       au-dessus d'une zone à 40 %. */
    const list = [...cities].sort((a, b) => b.percentage - a.percentage);
    return {
      sorted: list,
      maxPct: list.length ? Math.max(...list.map((c) => c.percentage)) : 0,
      total: list.reduce((sum, c) => sum + (Number(c.count) || 0), 0),
    };
  }, [cities]);

  if (isLoading) {
    return <div className="h-52 animate-pulse rounded-card border border-border bg-background-alt" />;
  }

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground">
              Répartition géographique
            </h2>
            <p className="text-xs text-foreground-muted">
              Distribution des logements par zone
            </p>
          </div>
        </div>

        <p className="shrink-0 text-xs text-foreground-muted">
          <span className="font-semibold tabular-nums text-foreground">{sorted.length}</span> zone
          {sorted.length > 1 ? 's' : ''} ·{' '}
          <span className="font-semibold tabular-nums text-foreground">{total}</span> annonce
          {total > 1 ? 's' : ''}
        </p>
      </header>

      {sorted.length > 0 ? (
        <ul className="space-y-3">
          {sorted.map((city, idx) => {
            /* Échelle relative au maximum : si la plus grosse zone fait 22 %,
               aucune barre ne dépassait le quart de la largeur et les écarts
               devenaient illisibles.

               Et plus de plancher à 4 % : une zone à 1 % s'affichait comme
               une zone à 4 %, ce qui masque justement la concentration qu'on
               cherche à lire. */
            const width = maxPct > 0 ? (city.percentage / maxPct) * 100 : 0;

            return (
              <li key={city.ville} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-foreground">{city.ville}</span>
                  <span className="shrink-0 text-foreground-muted">
                    <span className="tabular-nums">{city.count}</span> annonce
                    {city.count > 1 ? 's' : ''}
                    {' · '}
                    <span className="font-semibold tabular-nums text-foreground">
                      {city.percentage.toFixed(1).replace('.', ',')} %
                    </span>
                  </span>
                </div>

                <div
                  role="img"
                  aria-label={`${city.ville} : ${city.count} annonces, ${city.percentage} pour cent`}
                  className="h-2 w-full overflow-hidden rounded-pill bg-background-alt"
                >
                  <div
                    className={cn(
                      'h-full rounded-pill transition-[width] duration-500',
                      idx === 0 ? 'bg-forest-700' : 'bg-forest-500',
                    )}
                    style={{ width: `${width}%`, minWidth: city.percentage > 0 ? '2px' : 0 }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt p-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-pill border border-border bg-background-card text-foreground-muted">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-foreground">Aucune donnée géographique</p>
          <p className="text-xs text-foreground-muted">
            La répartition apparaîtra dès les premières publications.
          </p>
        </div>
      )}
    </section>
  );
}