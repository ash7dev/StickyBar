'use client';

import {
  TrendingUp,
  CalendarCheck,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   Animated Spark Bars
   ═══════════════════════════════════════════════════════════════════════════ */

interface SparkBarsProps {
  data: number[];
  color: string;
}

function SparkBars({ data, color }: SparkBarsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-end gap-[4px] h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-700 ease-out"
          style={{
            width: 5,
            height: mounted ? `${Math.max(v, 14)}%` : '6%',
            background: color,
            opacity: mounted ? 0.35 + (v / 100) * 0.65 : 0.2,
            transitionDelay: `${i * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   KPI Card — Premium Klef v2
   ═══════════════════════════════════════════════════════════════════════════ */

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel: string;
  icon: React.ElementType;
  sparkData: number[];
  hero?: boolean;
  accentHex?: string;
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  trendLabel,
  icon: Icon,
  sparkData,
  hero = false,
  accentHex = '#D3F26E',
}: KpiCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-card p-3.5 sm:p-5 transition-all duration-300 min-h-[120px] sm:min-h-[145px] flex flex-col justify-between
        ${hero
          ? 'bg-gradient-to-b from-forest-950 via-[#072A20] to-forest-950 text-white border border-forest-800/90 shadow-xl'
          : 'bg-background-card border border-border/80 shadow-2xs hover:border-forest-600/30 hover:shadow-md hover:-translate-y-0.5'
        }
      `}
    >
      {/* Halos de fond */}
      {hero ? (
        <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-lime-400/10 blur-2xl" />
      ) : (
        <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-forest-950/5 blur-2xl" />
      )}

      {/* Top Row: Icon + Label */}
      <div className="relative z-10 flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-inner flex items-center justify-center shrink-0 shadow-2xs
            ${hero
              ? 'bg-forest-900 border border-lime-400/20 text-lime-400'
              : 'bg-forest-950 text-lime-400 border border-lime-400/20'
            }
          `}
        >
          <Icon className="w-4.5 h-4.5 text-lime-400" />
        </div>
        <p className={`text-[10px] font-extrabold uppercase tracking-wider leading-tight ${hero ? 'text-forest-200' : 'text-foreground-muted'}`}>
          {label}
        </p>
      </div>

      {/* Bottom Row: Value + Spark */}
      <div className="relative z-10 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-none ${hero ? 'text-white' : 'text-forest-950'}`}>
              {value}
            </span>
            {sub && (
              <span className={`text-[10px] font-extrabold uppercase ${hero ? 'text-lime-300' : 'text-foreground-muted'}`}>
                {sub}
              </span>
            )}
          </div>

          <div className={`flex items-center gap-1 text-[10px] font-bold ${
            hero
              ? 'text-lime-300'
              : trend === 'up'
                ? 'text-forest-700'
                : trend === 'down'
                  ? 'text-error-600'
                  : 'text-foreground-muted'
          }`}>
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-lime-600" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-error-600" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            <span className="truncate">{trendLabel}</span>
          </div>
        </div>

        <div className="hidden sm:flex shrink-0">
          <SparkBars data={sparkData} color={hero ? '#D3F26E' : accentHex} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   KPI Section
   ═══════════════════════════════════════════════════════════════════════════ */

interface Props {
  stats: {
    revenue: number;
    totalBookings: number;
    activeDisputes: number;
    activeListings: number;
  };
  pendingConfirmations: number;
}

function generateSpark(seed: number): number[] {
  const base = [30, 48, 38, 72, 52, 88, 96];
  return base.map((v, i) =>
    Math.min(100, Math.max(12, v + ((seed * (i + 1) * 17) % 35) - 17)),
  );
}

export function KpiSection({ stats, pendingConfirmations }: Props) {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
    return n.toString();
  };

  return (
    <div className="space-y-4">
      {/* Desktop Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenus du mois"
          value={fmt(stats.revenue)}
          sub="FCFA"
          trend="up"
          trendLabel="Ce mois-ci"
          icon={TrendingUp}
          sparkData={generateSpark(stats.revenue || 7)}
          hero
        />
        <KpiCard
          label="Réservations actives"
          value={pendingConfirmations.toString()}
          sub="EN COURS"
          trend={pendingConfirmations > 0 ? 'up' : 'neutral'}
          trendLabel={`${stats.totalBookings} au total`}
          icon={CalendarCheck}
          sparkData={generateSpark(stats.totalBookings || 3)}
          accentHex="#041912"
        />
        <KpiCard
          label="Annonces actives"
          value={stats.activeListings.toString()}
          sub={stats.activeListings === 1 ? 'BIEN' : 'BIENS'}
          trend="neutral"
          trendLabel="Publiées"
          icon={Building2}
          sparkData={generateSpark(stats.activeListings || 5)}
          accentHex="#D3F26E"
        />
        <KpiCard
          label="Litiges ouverts"
          value={stats.activeDisputes.toString()}
          sub={stats.activeDisputes === 0 ? 'LITIGES' : 'LITIGE'}
          trend={stats.activeDisputes === 0 ? 'neutral' : 'down'}
          trendLabel={stats.activeDisputes === 0 ? 'Sain et sécurisé' : 'Action requise'}
          icon={AlertTriangle}
          sparkData={generateSpark(stats.activeDisputes || 2)}
          accentHex={stats.activeDisputes > 0 ? '#D64B3C' : '#14654C'}
        />
      </div>

      {/* Mobile grid (Grille 2x2 avec 4 KPIs) */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <KpiCard
          label="Revenus du mois"
          value={fmt(stats.revenue)}
          sub="FCFA"
          trend="up"
          trendLabel="Ce mois-ci"
          icon={TrendingUp}
          sparkData={generateSpark(stats.revenue || 7)}
          hero
        />
        <KpiCard
          label="Réservations"
          value={pendingConfirmations.toString()}
          sub="EN COURS"
          trend={pendingConfirmations > 0 ? 'up' : 'neutral'}
          trendLabel={`${stats.totalBookings} total`}
          icon={CalendarCheck}
          sparkData={generateSpark(stats.totalBookings || 3)}
        />
        <KpiCard
          label="Annonces"
          value={stats.activeListings.toString()}
          sub="BIENS"
          trend="neutral"
          trendLabel="Publiées"
          icon={Building2}
          sparkData={generateSpark(stats.activeListings || 5)}
        />
        <KpiCard
          label="Litiges"
          value={stats.activeDisputes.toString()}
          sub={stats.activeDisputes === 0 ? 'LITIGES' : 'LITIGE'}
          trend={stats.activeDisputes === 0 ? 'neutral' : 'down'}
          trendLabel={stats.activeDisputes === 0 ? 'Sain' : 'Action requise'}
          icon={AlertTriangle}
          sparkData={generateSpark(stats.activeDisputes || 2)}
          accentHex={stats.activeDisputes > 0 ? '#D64B3C' : '#14654C'}
        />
      </div>
    </div>
  );
}
