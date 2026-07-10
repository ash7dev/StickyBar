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

const RANK_STYLES = {
  1: { bg: 'bg-amber-100',   text: 'text-amber-600',   ring: 'ring-amber-200',   bar: 'from-amber-400 to-amber-500',   medal: '🥇' },
  2: { bg: 'bg-neutral-100', text: 'text-foreground-muted', ring: 'ring-neutral-200', bar: 'from-neutral-300 to-neutral-400', medal: '🥈' },
  3: { bg: 'bg-orange-100',  text: 'text-orange-600',  ring: 'ring-orange-200',  bar: 'from-orange-300 to-orange-400',  medal: '🥉' },
};

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
    <div className="bg-background-card rounded-2xl border border-border/80 flex flex-col flex-1 min-h-[420px] hover:shadow-xl hover:shadow-md/40 hover:-translate-y-0.5 transition-all duration-500 relative overflow-hidden group/card">

      {/* Ambient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between p-4 lg:p-6 pb-3 lg:pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
            <Trophy className="w-[16px] h-[16px] lg:w-[18px] lg:h-[18px] text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">Performance</p>
            <h3 className="text-sm font-bold text-foreground">Classement {monthCapitalized}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 shrink-0">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600">{conversionRate}% actifs</span>
        </div>
      </div>

      {/* ── Section label ───────────────────────────────────────── */}
      <div className="relative z-10 px-4 lg:px-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-foreground-muted" />
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Top Propriétés</span>
        </div>
        <span className="text-[10px] text-foreground-muted font-medium">Revenus</span>
      </div>

      {/* ── Ranked list ─────────────────────────────────────────── */}
      <div className="relative z-10 px-4 lg:px-6 flex-1">
        {ranked.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Star className="w-6 h-6 text-neutral-200 mb-2" />
            <p className="text-xs font-bold text-foreground-muted">Aucune donnée classée</p>
            <p className="text-[11px] text-foreground-muted mt-1">Les réservations actives apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranked.map((item, i) => {
              const rank      = (i + 1) as 1 | 2 | 3;
              const barPct    = maxRevenue > 0 ? Math.round((item.revenue / maxRevenue) * 100) : 0;
              const occupation = Math.min(conversionRate + (3 - i) * 8, 100);
              const rankStyle = RANK_STYLES[rank] ?? RANK_STYLES[2];
              const isFirst   = rank === 1;

              return (
                <div
                  key={item.titre}
                  className={`group/row rounded-2xl transition-all duration-200 ${
                    isFirst
                      ? 'bg-gradient-to-br from-amber-50 to-amber-50/30 border border-amber-100 shadow-sm'
                      : 'border border-neutral-100 hover:border-border hover:bg-neutral-50/60'
                  }`}
                >
                  {/* ── Mobile layout ─────────────────────────── */}
                  <div className="lg:hidden p-3">
                    {/* Row 1: rank badge + title + séjours */}
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-inset font-black text-xs ${rankStyle.bg} ${rankStyle.text} ${rankStyle.ring}`}>
                        {rank}
                      </div>
                      <p className="flex-1 text-sm font-bold text-foreground truncate leading-tight">
                        {item.titre}
                      </p>
                      <span className="shrink-0 text-[10px] font-bold text-foreground-muted bg-neutral-100 px-2 py-0.5 rounded-full">
                        {item.nbLocations} séjour{item.nbLocations > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Row 2: big price + occupation badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black tracking-tight ${isFirst ? 'text-amber-700' : 'text-foreground'}`}>
                          {fmt(item.revenue)}
                        </span>
                        <span className="text-[9px] font-bold text-foreground-muted uppercase">FCFA</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        occupation >= 70
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-neutral-50 text-foreground-muted border-neutral-100'
                      }`}>
                        {occupation}% occ.
                      </span>
                    </div>

                    {/* Row 3: progress bar */}
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${rankStyle.bar}`}
                        style={{ width: mounted ? `${Math.max(barPct, 2)}%` : '0%', transitionDelay: `${i * 150}ms` }}
                      />
                    </div>
                  </div>

                  {/* ── Desktop layout ────────────────────────── */}
                  <div className="hidden lg:block p-3">
                    <div className="flex items-center gap-3.5 mb-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-inset ${rankStyle.bg} ${rankStyle.text} ${rankStyle.ring}`}>
                        <span className="text-xs font-black">{rank}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isFirst ? 'text-amber-900' : 'text-foreground'}`}>
                          {item.titre}
                        </p>
                        <p className="text-[10px] font-medium text-foreground-muted mt-0.5">
                          Occupation : <span className="font-bold text-neutral-700">{occupation}%</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-black text-foreground tracking-tight">
                          {fmt(item.revenue)} <span className="text-[9px] font-bold text-foreground-muted uppercase">FCFA</span>
                        </p>
                        <p className="text-[10px] font-medium text-foreground-muted mt-0.5">
                          {item.nbLocations} séjour{item.nbLocations > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="ml-[46px] h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${rankStyle.bar}`}
                        style={{ width: mounted ? `${Math.max(barPct, 2)}%` : '0%', transitionDelay: `${i * 150}ms` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-neutral-100 p-2 mt-4">
        <Link
          href="/dashboard/annonces"
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-foreground-muted hover:text-primary-600 hover:bg-primary-50 transition-colors w-full"
        >
          Voir le détail des annonces
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
