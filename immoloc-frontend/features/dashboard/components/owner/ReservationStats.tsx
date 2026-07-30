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

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  CHECKED_IN: { label: 'En cours',   color: '#14654C' },
  CONFIRMED:  { label: 'Confirmées', color: '#D3F26E' },
  COMPLETED:  { label: 'Terminées',  color: 'var(--neutral-400)' },
  PENDING:    { label: 'En attente', color: 'var(--warning-500)' },
  CANCELLED:  { label: 'Annulées',   color: 'var(--error-500)' },
  DISPUTED:   { label: 'Litiges',    color: 'var(--error-600)' },
  PAID:       { label: 'Payées',     color: '#D3F26E' },
};

function SemiCircleChart({ percentage, size = 180 }: { percentage: number; size?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (mounted ? (percentage / 100) * circumference : 0);
  const center = size / 2;

  return (
    <div className="relative w-full max-w-[190px] mx-auto" style={{ aspectRatio: '190 / 114' }}>
      <svg viewBox={`0 0 ${size} ${size * 0.6}`} className="w-full h-auto overflow-visible">
        <path
          d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
          fill="none"
          stroke="#14654C"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <span className="font-display text-3xl font-extrabold text-forest-950 tracking-tight leading-none">
          {percentage}%
        </span>
        <span className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider mt-1">
          Performance globale
        </span>
      </div>
    </div>
  );
}

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
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="font-display text-xs font-bold text-forest-950">{label}</span>
      </div>
      <span className="text-xs font-bold text-foreground-muted">{sublabel}</span>
    </div>
  );
}

export function ReservationStats({ bookings }: Props) {
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

  const mainPercentage = entries[0]?.pct ?? 0;

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 lg:p-6 shadow-2xs hover:border-forest-600/30 hover:shadow-md transition-all space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pb-3 border-b border-border/60">
        <div>
          <h3 className="font-display text-sm sm:text-base font-bold text-forest-950">Statistiques d&apos;activité</h3>
          <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Répartition des séjours</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center">
            <PieChart className="w-5 h-5 text-lime-400" />
          </div>
          <p className="font-display text-sm font-bold text-forest-950">Aucune statistique disponible</p>
          <p className="text-xs text-foreground-muted">Les données s&apos;afficheront avec vos premières réservations.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center my-2">
            <SemiCircleChart percentage={mainPercentage} size={190} />
          </div>

          <div className="space-y-1">
            {entries.slice(0, 3).map((e) => (
              <LegendItem
                key={e.statut}
                color={e.color}
                label={e.label}
                sublabel={`${e.count} réservation${e.count > 1 ? 's' : ''}`}
              />
            ))}
          </div>

          <Link
            href="/dashboard/reservations"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-pill bg-background-alt hover:bg-background-card text-forest-950 font-extrabold text-xs transition-all border border-border/80 shadow-2xs"
          >
            <span>Voir les statistiques détaillées</span>
            <ArrowRight className="w-3.5 h-3.5 text-forest-950" />
          </Link>
        </>
      )}
    </div>
  );
}
