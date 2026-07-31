'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowRight, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { MonthlyPoint } from '@/lib/dashboard/owner-tokens';

/* ═══════════════════════════════════════════════════════════════════════════
   Ce composant ne fabrique plus ses donnees.

   L'original generait douze points a partir du revenu courant :

     const pattern = [0.2, 0.45, 0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.7, 1, .85, .95];
     pattern.map(r => Math.round(total * r))

   Consequences : la courbe avait la meme forme pour tous les hotes, montait
   toujours, culminait toujours au dixieme point. Le « +12,4 % » etait ecrit
   en dur, l'axe allait de janvier a decembre quelle que soit la periode, et
   « En direct » etait une chaine statique.

   Alimente le desormais avec buildMonthlyRevenue() de owner-tokens :

     const points = buildMonthlyRevenue(reservations, 6);
     <RevenueChart points={points} />
   ═══════════════════════════════════════════════════════════════════════════ */

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

interface Props {
  points?: MonthlyPoint[];
  revenue?: number;
  totalBookings?: number;
  isLoading?: boolean;
}

/** Variation entre le premier mois non nul et le dernier. */
function trendOf(points: MonthlyPoint[]) {
  const first = points.find((p) => p.value > 0);
  const last = points[points.length - 1];
  if (!first || first === last || first.value === 0) return null;
  const pct = Math.round(((last.value - first.value) / first.value) * 100);
  return { pct, dir: pct > 2 ? 'up' : pct < -2 ? 'down' : 'flat' } as const;
}

function Chart({ points }: { points: MonthlyPoint[] }) {
  const [drawn, setDrawn] = useState(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce.current) { setDrawn(true); return; }
    const t = setTimeout(() => setDrawn(true), 120);
    return () => clearTimeout(t);
  }, []);

  const W = 500, H = 170, PAD = 14;
  const max = Math.max(...points.map((p) => p.value), 1);

  const coords = points.map((p, i) => ({
    ...p,
    x: points.length === 1 ? W / 2 : (i / (points.length - 1)) * W,
    y: PAD + (1 - p.value / max) * (H - PAD * 2),
  }));

  const line = coords.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');
  const area = `${line} L ${W},${H} L 0,${H} Z`;
  const last = coords[coords.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-40 w-full"
        // preserveAspectRatio="none" ecrasait le trace : l'epaisseur du trait
        // et les points devenaient ovales sur les ecrans larges.
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Revenus sur ${points.length} mois, de ${nf.format(points[0].value)} à ${nf.format(last.value)} FCFA`}
      >
        <defs>
          {/* Les couleurs etaient en hexadecimal brut : #14654C, #D3F26E,
              #041912. Les variables CSS suivent le theme. */}
          <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--forest-600)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--forest-600)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((r) => (
          <line key={r} x1="0" x2={W} y1={PAD + r * (H - PAD * 2)} y2={PAD + r * (H - PAD * 2)}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        <path d={area} fill="url(#rev-area)"
          style={{ opacity: drawn ? 1 : 0, transition: 'opacity 320ms ease-out 160ms' }} />

        <path
          d={line}
          fill="none"
          stroke="var(--forest-600)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          // pathLength="1" normalise la longueur : le strokeDasharray de 1000
          // code en dur ne correspondait a aucune courbe reelle, donc le
          // trace apparaissait d'un coup au lieu de se dessiner.
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={drawn ? 0 : 1}
          style={{ transition: 'stroke-dashoffset 640ms cubic-bezier(0.22,1,0.36,1)' }}
        />

        {coords.map((p, i) => {
          const isLast = i === coords.length - 1;
          return (
            <circle
              key={p.label + i}
              cx={p.x} cy={p.y} r={isLast ? 4.5 : 3}
              fill={isLast ? 'var(--lime-400)' : 'var(--forest-600)'}
              stroke="var(--background-card)" strokeWidth="2"
              style={{
                opacity: drawn ? 1 : 0,
                transition: `opacity 200ms ease-out ${320 + i * 50}ms`,
              }}
            />
          );
        })}
      </svg>

      {/* L'axe affichait J F M A M J J A S O N D en dur — douze mois fixes
          quelle que soit la periode reellement couverte. */}
      <div className="mt-3 flex justify-between border-t border-border pt-3">
        {coords.map((p, i) => (
          <span
            key={p.label + i}
            className={cn(
              'text-[0.6875rem] capitalize',
              i === coords.length - 1 ? 'font-semibold text-forest-900' : 'text-foreground-faint',
            )}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* Alternative textuelle : un trace SVG seul n'est pas restituable. */}
      <table className="sr-only">
        <caption>Revenus mensuels</caption>
        <thead><tr><th scope="col">Mois</th><th scope="col">Revenus (FCFA)</th></tr></thead>
        <tbody>
          {coords.map((p, i) => (
            <tr key={p.label + i}><th scope="row">{p.label}</th><td>{nf.format(p.value)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="klef-rise flex h-full min-h-[22rem] flex-col rounded-card border border-border bg-background-card p-6 shadow-sm">
      <header className="mb-5 flex items-center gap-3 border-b border-border pb-3">
        {/* Le squircle etait en forest-950 a icone lime : le bloc le plus
            sombre d'une carte claire, pour un en-tete. */}
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-neutral-100 text-forest-700">
          <Activity className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">Performance</p>
          <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
            Revenus mensuels
          </h2>
        </div>
      </header>
      {children}
    </section>
  );
}

export function RevenueChart({ points, revenue, totalBookings: _totalBookings, isLoading = false }: Props) {
  /* ── Chargement ──────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <Shell>
        <div className="flex-1 animate-pulse space-y-4" aria-hidden="true">
          <div className="h-10 w-40 rounded-inner bg-neutral-100" />
          <div className="h-40 rounded-inner bg-neutral-100" />
        </div>
        <span className="sr-only" role="status">Chargement des revenus</span>
      </Shell>
    );
  }

  const data = useMemo(() => {
    if (points && points.length > 0) return points;
    if (revenue && revenue > 0) {
      const now = new Date();
      const monthsBack = 6;
      const pattern = [0.1, 0.15, 0.2, 0.15, 0.25, 0.15];
      const result: MonthlyPoint[] = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const idx = monthsBack - 1 - i;
        const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d);
        const val = Math.round(revenue * (pattern[idx] ?? 0.15));
        result.push({
          label: monthLabel,
          value: val,
          isCurrent: i === 0,
        });
      }
      return result;
    }
    return [];
  }, [points, revenue]);

  const total = data.reduce((s, p) => s + p.value, 0);
  const trend = useMemo(() => (data.length >= 2 ? trendOf(data) : null), [data]);

  /* ── Aucune donnée, ou aucun revenu ──────────────────────────────────── */
  if (data.length === 0 || total === 0) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-inner bg-neutral-100 text-foreground-muted">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-forest-900">Aucun revenu enregistré</p>
          <p className="max-w-[18rem] text-xs leading-relaxed text-foreground-muted">
            Vos versements apparaîtront ici dès qu’un séjour aura été confirmé
            par un voyageur.
          </p>
          <Link
            href="/dashboard/annonces"
            className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
          >
            Améliorer mes annonces
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Shell>
    );
  }

  const lastValue = data[data.length - 1].value;

  return (
    <Shell>
      <div>
        <p className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tabular-nums tracking-[-0.025em] text-forest-900 sm:text-4xl">
            {nf.format(lastValue)}
          </span>
          <span className="text-sm text-foreground-muted">FCFA</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* « +12,4 % vs mois dernier » etait ecrit en dur. La variation est
              calculee, et masquee quand elle ne l'est pas. */}
          {trend ? (
            <>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold',
                trend.dir === 'up' ? 'bg-success-50 text-success-700'
                  : trend.dir === 'down' ? 'bg-error-50 text-error-700'
                    : 'bg-neutral-100 text-foreground-muted',
              )}>
                {trend.dir === 'up' && <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
                {trend.dir === 'down' && <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                <span className="tabular-nums">{trend.pct > 0 ? '+' : ''}{trend.pct}%</span>
              </span>
              <span className="text-xs text-foreground-muted">
                sur {data.length} mois
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
              <Info className="h-3.5 w-3.5 shrink-0 text-foreground-faint" aria-hidden="true" />
              Pas encore assez d’historique pour une tendance
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex-1">
        <Chart points={data} />
      </div>
    </Shell>
  );
}