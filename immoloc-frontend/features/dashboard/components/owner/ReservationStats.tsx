'use client';

import { PieChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Booking {
  statut: string;
}

interface Props {
  bookings: Booking[];
}

// Utilisation des couleurs du design system uniquement (variables CSS)
const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  CHECKED_IN: { label: 'En cours',   color: 'var(--emerald-600)' },
  CONFIRMED:  { label: 'Confirmées', color: 'var(--emerald-400)' },
  COMPLETED:  { label: 'Terminées',  color: 'var(--neutral-400)' },
  PENDING:    { label: 'En attente', color: 'var(--warning-500)' },
  CANCELLED:  { label: 'Annulées',   color: 'var(--error-500)' },
  DISPUTED:   { label: 'Litiges',    color: 'var(--error-600)' },
  PAID:       { label: 'Payées',     color: 'var(--success-500)' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Animated Semi-Circle Chart (like the photo)
   ═══════════════════════════════════════════════════════════════════════════ */

function SemiCircleChart({ percentage, size = 180 }: { percentage: number; size?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Semi-circle
  const offset = circumference - (mounted ? (percentage / 100) * circumference : 0);
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size * 0.6 }}>
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-neutral-100"
        />
        {/* Primary arc */}
        <path
          d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-600 transition-all duration-1000 ease-out"
        />
        {/* Secondary lighter arc */}
        <path
          d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset - 5}
          className="text-emerald-200 transition-all duration-1000 ease-out opacity-60"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
        <span className="text-4xl font-black text-foreground tracking-tight leading-none tabular-nums">
          {percentage}%
        </span>
        <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mt-1">
          Since yesterday
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Legend Item with simple bar
   ═══════════════════════════════════════════════════════════════════════════ */

function LegendItem({
  color,
  label,
  sublabel
}: {
  color: string;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <span className="text-xs font-medium text-foreground-muted">{sublabel}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component — Premium Design inspired by photo
   ═══════════════════════════════════════════════════════════════════════════ */

export function ReservationStats({ bookings }: Props) {
  // Exclude EXPIRED
  const filtered = bookings.filter((b) => b.statut !== 'EXPIRED');

  const groups: Record<string, number> = {};
  for (const b of filtered) {
    groups[b.statut] = (groups[b.statut] ?? 0) + 1;
  }

  const total = filtered.length;

  const entries = Object.entries(groups)
    .filter(([s]) => STATUT_CONFIG[s])
    .map(([statut, count]) => ({
      statut,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      ...STATUT_CONFIG[statut],
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate main percentage (highest category)
  const mainPercentage = entries[0]?.pct ?? 0;

  return (
    <div className="bg-background-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-300">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-foreground mb-0.5">Sales Performance</h3>
          <button className="text-xs font-medium text-foreground-muted hover:text-emerald-600 transition-colors flex items-center gap-1">
            Voir les statistiques
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────── */}
      {total === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-background-alt flex items-center justify-center mb-3">
            <PieChart className="w-5 h-5 text-foreground-muted" />
          </div>
          <p className="text-sm font-semibold text-foreground">Aucune réservation</p>
          <p className="text-xs text-foreground-muted mt-1">Les statistiques apparaîtront ici.</p>
        </div>
      ) : (
        <>
          {/* ── Semi-Circle Chart ────────────────────────────────────── */}
          <div className="flex items-center justify-center mb-6">
            <SemiCircleChart percentage={mainPercentage} size={200} />
          </div>

          {/* ── Legend ─────────────────────────────────────────────────── */}
          <div className="space-y-0">
            {entries.slice(0, 2).map((e) => (
              <LegendItem
                key={e.statut}
                color={e.color}
                label={e.label}
                sublabel={`${e.count} réservation${e.count > 1 ? 's' : ''}`}
              />
            ))}
          </div>

          {/* ── See Details link ──────────────────────────────────────── */}
          <Link
            href="/dashboard/reservations"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-emerald-600 transition-colors py-2"
          >
            Voir les statistiques
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}
