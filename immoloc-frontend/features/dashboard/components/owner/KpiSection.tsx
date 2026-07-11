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
   Animated Spark Bars — 7 mini bars that animate in on mount
   ═══════════════════════════════════════════════════════════════════════════ */

interface SparkBarsProps {
  data: number[];
  color: string; // raw hex or css color
}

function SparkBars({ data, color }: SparkBarsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-end gap-[4px] h-14">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-700 ease-out"
          style={{
            width: 6,
            height: mounted ? `${Math.max(v, 14)}%` : '6%',
            background: color,
            opacity: mounted ? 0.3 + (v / 100) * 0.7 : 0.15,
            transitionDelay: `${i * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   KPI Card — Premium White Glass
   ═══════════════════════════════════════════════════════════════════════════ */

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel: string;
  icon: React.ElementType;
  accent: {
    hex: string;       // e.g. "#10b981"
    bg: string;        // e.g. "bg-emerald-50"
    iconBg: string;    // e.g. "bg-emerald-100"
    iconText: string;  // e.g. "text-emerald-600"
    trendText: string; // e.g. "text-emerald-600"
    ring: string;      // e.g. "ring-emerald-200"
  };
  sparkData: number[];
  /** Hero mode — emerald gradient bg with white text */
  hero?: boolean;
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  trendLabel,
  icon: Icon,
  accent,
  sparkData,
  hero = false,
}: KpiCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        ${hero
          ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 border border-emerald-400/20 shadow-md hover:shadow-lg'
          : `bg-background-card border border-border ring-1 ring-transparent hover:ring-1 hover:${accent.ring} hover:border-border-hover shadow-sm hover:shadow-md`
        }
        p-6 pb-5 group
        transition-all duration-500
        hover:-translate-y-1
        min-h-[148px] flex flex-col justify-between
      `}
    >
      {/* ── Ambient glow ────────────────────────────────────────── */}
      {hero ? (
        <>
          {/* Light shimmer on hero card */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-background-card/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        </>
      ) : (
        <>
          <div
            className={`absolute -top-8 -right-8 w-28 h-28 ${accent.bg} rounded-full blur-2xl
                        opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none`}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `linear-gradient(90deg, transparent, ${accent.hex}40, transparent)` }}
          />
        </>
      )}

      {/* ── Top Row: Icon + Label ───────────────────────────────── */}
      <div className="relative z-10 flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      group-hover:scale-110 transition-transform duration-500
                      ${hero ? 'bg-background-card/15 backdrop-blur-sm border border-white/20' : accent.iconBg}`}
        >
          <Icon className={`w-[18px] h-[18px] ${hero ? 'text-white' : accent.iconText}`} />
        </div>
        <p className={`text-[11px] font-bold uppercase tracking-[0.1em] leading-tight
                       ${hero ? 'text-white/70' : 'text-foreground-muted'}`}>
          {label}
        </p>
      </div>

      {/* ── Bottom: Value + Trend (left) ‖ Spark Bars (right) ──── */}
      <div className="relative z-10 flex items-end justify-between gap-3">
        {/* Left — Value & Trend */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className={`text-[1.75rem] font-extrabold tracking-tight leading-none
                              ${hero ? 'text-white' : 'text-foreground'}`}>
              {value}
            </span>
            {sub && (
              <span className={`text-[10px] font-semibold uppercase
                                ${hero ? 'text-white/60' : 'text-foreground-muted'}`}>
                {sub}
              </span>
            )}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] font-semibold ${
              hero
                ? 'text-white/80'
                : trend === 'up'
                  ? accent.trendText
                  : trend === 'down'
                    ? 'text-error-500'
                    : 'text-foreground-muted'
            }`}
          >
            {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            <span className="truncate">{trendLabel}</span>
          </div>
        </div>

        {/* Right — Spark Bars */}
        <SparkBars data={sparkData} color={hero ? '#ffffff' : accent.hex} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Color Accent Presets
   ═══════════════════════════════════════════════════════════════════════════ */

const ACCENTS = {
  // Vert Forêt — Primary
  emerald: {
    hex: '#14654C',
    bg: 'bg-emerald-100',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    trendText: 'text-emerald-600',
    ring: 'ring-emerald-200',
  },
  // Terracotta — Accent
  accent: {
    hex: '#C75B23',
    bg: 'bg-accent-100',
    iconBg: 'bg-accent-50',
    iconText: 'text-accent-600',
    trendText: 'text-accent-600',
    ring: 'ring-accent-200',
  },
  // Or — Premium
  gold: {
    hex: '#C9A24B',
    bg: 'bg-gold-100',
    iconBg: 'bg-gold-50',
    iconText: 'text-gold-600',
    trendText: 'text-gold-600',
    ring: 'ring-gold-200',
  },
  // Success
  success: {
    hex: '#10b981',
    bg: 'bg-success-100',
    iconBg: 'bg-success-50',
    iconText: 'text-success-600',
    trendText: 'text-success-600',
    ring: 'ring-success-100',
  },
  // Warning
  warning: {
    hex: '#f59e0b',
    bg: 'bg-warning-100',
    iconBg: 'bg-warning-50',
    iconText: 'text-warning-600',
    trendText: 'text-warning-600',
    ring: 'ring-warning-200',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   KPI Section — Public API (contract unchanged)
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

/** Deterministic pseudo-random sparkline data */
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
      {/* Mobile: 1ère carte full width, 2ème et 3ème côte à côte | Desktop: grid 4 colonnes */}

      {/* Revenus - Masqué en mobile car déjà dans le header mobile */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenus du mois"
          value={fmt(stats.revenue)}
          sub="FCFA"
          trend="up"
          trendLabel="Ce mois-ci"
          icon={TrendingUp}
          accent={ACCENTS.emerald}
          sparkData={generateSpark(stats.revenue || 7)}
          hero
        />
        <KpiCard
          label="Réservations actives"
          value={pendingConfirmations.toString()}
          sub={pendingConfirmations === 1 ? 'EN COURS' : 'EN COURS'}
          trend={pendingConfirmations > 0 ? 'up' : 'neutral'}
          trendLabel={`${stats.totalBookings} au total`}
          icon={CalendarCheck}
          accent={ACCENTS.accent}
          sparkData={generateSpark(stats.totalBookings || 3)}
        />
        <KpiCard
          label="Annonces actives"
          value={stats.activeListings.toString()}
          sub={stats.activeListings === 1 ? 'BIEN' : 'BIENS'}
          trend="neutral"
          trendLabel="Publiées"
          icon={Building2}
          accent={ACCENTS.gold}
          sparkData={generateSpark(stats.activeListings || 5)}
        />
        <KpiCard
          label="Litiges ouverts"
          value={stats.activeDisputes.toString()}
          sub={stats.activeDisputes === 0 ? 'LITIGES' : 'LITIGE'}
          trend={stats.activeDisputes === 0 ? 'neutral' : 'down'}
          trendLabel={
            stats.activeDisputes === 0 ? 'Sain et sécurisé' : 'Action requise'
          }
          icon={AlertTriangle}
          accent={stats.activeDisputes > 0 ? ACCENTS.warning : ACCENTS.success}
          sparkData={generateSpark(stats.activeDisputes || 2)}
        />
      </div>

      {/* Mobile only: Réservations actives full width */}
      <div className="sm:hidden">
        <KpiCard
          label="Réservations actives"
          value={pendingConfirmations.toString()}
          sub={pendingConfirmations === 1 ? 'EN COURS' : 'EN COURS'}
          trend={pendingConfirmations > 0 ? 'up' : 'neutral'}
          trendLabel={`${stats.totalBookings} au total`}
          icon={CalendarCheck}
          accent={ACCENTS.accent}
          sparkData={generateSpark(stats.totalBookings || 3)}
        />
      </div>

      {/* Mobile only: Annonces + Litiges côte à côte */}
      <div className="grid grid-cols-2 gap-4 sm:hidden">
        <KpiCard
          label="Annonces actives"
          value={stats.activeListings.toString()}
          sub={stats.activeListings === 1 ? 'BIEN' : 'BIENS'}
          trend="neutral"
          trendLabel="Publiées"
          icon={Building2}
          accent={ACCENTS.gold}
          sparkData={generateSpark(stats.activeListings || 5)}
        />
        <KpiCard
          label="Litiges ouverts"
          value={stats.activeDisputes.toString()}
          sub={stats.activeDisputes === 0 ? 'LITIGES' : 'LITIGE'}
          trend={stats.activeDisputes === 0 ? 'neutral' : 'down'}
          trendLabel={
            stats.activeDisputes === 0 ? 'Sain et sécurisé' : 'Action requise'
          }
          icon={AlertTriangle}
          accent={stats.activeDisputes > 0 ? ACCENTS.warning : ACCENTS.success}
          sparkData={generateSpark(stats.activeDisputes || 2)}
        />
      </div>
    </div>
  );
}
