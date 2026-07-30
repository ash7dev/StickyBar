'use client';

import { Trophy, BarChart2, ArrowRight, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Booking {
  totalLocataire: number;
  statut: string;
  logement: { titre: string; ville?: string };
}

interface Props {
  bookings: Booking[];
  conversionRate: number;
  activeListings: number;
}

interface LogementStat {
  titre: string;
  revenue: number;
  nbLocations: number;
}

export function PerformanceCard({ bookings, conversionRate, activeListings }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

  const EXCLUDED = new Set(['CANCELLED', 'PENDING', 'EXPIRED']);

  const map: Record<string, LogementStat> = {};
  for (const b of bookings) {
    if (EXCLUDED.has(b.statut)) continue;
    const key = b.logement.titre;
    if (!map[key]) map[key] = { titre: b.logement.titre, revenue: 0, nbLocations: 0 };
    map[key].revenue += Number(b.totalLocataire ?? 0);
    map[key].nbLocations += 1;
  }

  const ranked = Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  const maxRevenue = ranked[0]?.revenue ?? 1;

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const monthCapitalized = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 lg:p-6 flex flex-col justify-between shadow-2xs hover:border-forest-600/30 hover:shadow-md transition-all min-h-[380px] space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pb-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy className="w-4 h-4 text-lime-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Performance</p>
            <h3 className="font-display text-sm sm:text-base font-bold text-forest-950 truncate">Classement {monthCapitalized}</h3>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-pill bg-forest-50 border border-forest-100 text-forest-800 text-[11px] sm:text-xs font-extrabold shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-forest-600" />
          <span>{conversionRate}% actifs</span>
        </div>
      </div>

      {/* Ranked List */}
      <div className="flex-1 space-y-3">
        {ranked.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-lime-400" />
            </div>
            <p className="font-display text-sm font-bold text-forest-950">Aucune donnée classée</p>
            <p className="text-xs text-foreground-muted">Les réservations activées apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {ranked.map((item, i) => {
              const rank = i + 1;
              const barPct = maxRevenue > 0 ? Math.round((item.revenue / maxRevenue) * 100) : 0;
              const isFirst = rank === 1;

              return (
                <div
                  key={item.titre}
                  className={`p-3.5 rounded-inner border transition-all ${
                    isFirst
                      ? 'bg-forest-950 text-white border-forest-800 shadow-md'
                      : 'bg-background-alt border-border/80 text-forest-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-pill flex items-center justify-center font-display font-extrabold text-xs shrink-0 ${
                        isFirst ? 'bg-lime-400 text-forest-950' : 'bg-background-card border border-border text-forest-950'
                      }`}>
                        {rank}
                      </span>
                      <p className={`font-display text-xs font-bold truncate ${isFirst ? 'text-white' : 'text-forest-950'}`}>
                        {item.titre}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-display text-xs font-extrabold ${isFirst ? 'text-lime-400' : 'text-forest-950'}`}>
                        {fmt(item.revenue)} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 rounded-pill bg-border/40 overflow-hidden">
                    <div
                      className={`h-full rounded-pill transition-all duration-1000 ${isFirst ? 'bg-lime-400' : 'bg-forest-700'}`}
                      style={{ width: mounted ? `${Math.max(barPct, 4)}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-border/60">
        <Link
          href="/dashboard/annonces"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-pill bg-background-alt hover:bg-background-card text-forest-950 font-extrabold text-xs transition-all border border-border/80 shadow-2xs"
        >
          <span>Voir le détail des annonces</span>
          <ArrowRight className="w-3.5 h-3.5 text-forest-950" />
        </Link>
      </div>
    </div>
  );
}
