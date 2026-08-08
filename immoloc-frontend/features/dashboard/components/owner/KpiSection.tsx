'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Building2,
  CalendarCheck, Minus, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   Les micro-graphiques etaient FABRIQUES.

     const base = [30, 48, 38, 72, 52, 88, 96];
     base.map((v, i) => v + ((seed * (i + 1) * 17) % 35) - 17)

   La courbe etait derivee de la valeur affichee par une formule, sur les
   quatre cartes. Et la base se terminant a 96, chaque tendance montait,
   toujours — y compris celle des litiges.

   Ici la courbe n'apparait QUE si un historique reel est fourni, et la
   tendance est calculee a partir de lui. Sans historique, la carte affiche
   son chiffre sans decor : c'est plus honnete et plus lisible.
   ═══════════════════════════════════════════════════════════════════════════ */

const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const t = setTimeout(() => setShown(true), 120);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...data, 1);

  return (
    <div className="flex h-10 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className={cn('w-[5px] rounded-pill', tone)}
          style={{
            height: shown ? `${Math.max((v / max) * 100, 8)}%` : '8%',
            // transition-all animait tout ; seule la hauteur change.
            transition: `height 320ms cubic-bezier(0.22,1,0.36,1) ${i * 45}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** Variation entre la première et la dernière valeur non nulle. */
function trendOf(history?: number[]) {
  if (!history || history.length < 2) return null;
  const first = history.find((v) => v > 0);
  const last = history[history.length - 1];
  if (first === undefined || first === 0) return null;
  const pct = Math.round(((last - first) / first) * 100);
  return { pct, dir: pct > 2 ? 'up' : pct < -2 ? 'down' : 'flat' } as const;
}

interface Kpi {
  key: string;
  label: string;
  value: string;
  unit?: string;
  icon: React.ElementType;
  history?: number[];
  /** Phrase de contexte, affichée quand aucune tendance n'est calculable. */
  note?: string;
  href?: string;
  variant?: 'hero' | 'alert' | 'default';
}

function KpiCard({ kpi, delay }: { kpi: Kpi; delay: string }) {
  const { label, value, unit, icon: Icon, history, note, href, variant = 'default' } = kpi;
  const trend = trendOf(history);
  const hero = variant === 'hero';
  const alert = variant === 'alert';

  const body = (
    <>
      <div className="mb-3 flex items-center gap-3">
        {/* Le squircle etait en forest-950 a icone lime sur des cartes
            CLAIRES : trois blocs sombres dans une rangee de quatre. */}
        <span className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-inner',
          hero ? 'bg-marker-bg text-on-inverse-marker'
            : alert ? 'bg-error-500/15 text-error-600'
              : 'bg-neutral-100 text-forest-700',
        )}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className={cn(
          'text-[0.6875rem] font-semibold uppercase leading-tight tracking-[0.12em]',
          hero ? 'text-forest-200' : 'text-foreground-faint',
        )}>
          {label}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5">
            <span className={cn(
              'font-display text-2xl font-semibold leading-none tabular-nums tracking-[-0.02em] sm:text-3xl',
              hero ? 'text-neutral-50' : alert ? 'text-error-700' : 'text-forest-900',
            )}>
              {value}
            </span>
            {unit && (
              <span className={cn('text-xs', hero ? 'text-forest-200' : 'text-foreground-muted')}>
                {unit}
              </span>
            )}
          </p>

          {/* La tendance n'apparait que si elle est calculable. Avant, une
              fleche montante etait codee en dur sur les revenus. */}
          {trend ? (
            <p className={cn(
              'mt-1.5 flex items-center gap-1 text-xs',
              trend.dir === 'up' ? (hero ? 'text-on-inverse-marker' : 'text-success-700')
                : trend.dir === 'down' ? 'text-error-600'
                  : hero ? 'text-forest-200' : 'text-foreground-muted',
            )}>
              {trend.dir === 'up' && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
              {trend.dir === 'down' && <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
              {trend.dir === 'flat' && <Minus className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="tabular-nums">{trend.pct > 0 ? '+' : ''}{trend.pct}%</span>
              <span className="truncate">sur la période</span>
            </p>
          ) : note ? (
            <p className={cn('mt-1.5 truncate text-xs', hero ? 'text-forest-200' : 'text-foreground-muted')}>
              {note}
            </p>
          ) : null}
        </div>

        {history && history.length >= 2 && (
          <div className="hidden shrink-0 sm:flex">
            <Spark
              data={history}
              tone={hero ? 'bg-lime-400/70' : alert ? 'bg-error-500/60' : 'bg-forest-400/60'}
            />
          </div>
        )}
      </div>
    </>
  );

  const shell = cn(
    'klef-rise relative flex min-h-[7.5rem] flex-col justify-between rounded-card p-4 sm:min-h-[9rem] sm:p-5',
    'transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none',
    hero
      // Le degrade partait de forest-950 pour y revenir via #072A20, soit
      // forest-900 en hexadecimal brut. Halo radial du systeme a la place.
      ? 'bg-[radial-gradient(80%_60%_at_50%_0%,var(--forest-700)_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] text-white'
      : alert
        ? 'border border-error-500/30 bg-error-50'
        : 'border border-border bg-background-card shadow-sm hover:-translate-y-0.5 hover:shadow-md',
  );

  const style = { '--rise-delay': delay } as React.CSSProperties;

  return href
    ? <Link href={href} className={shell} style={style}>{body}</Link>
    : <div className={shell} style={style}>{body}</div>;
}

/* ─── Section ─────────────────────────────────────────────────────────────── */

interface Props {
  stats: {
    revenue: number;
    totalBookings: number;
    activeDisputes: number;
    activeListings: number;
  };
  pendingConfirmations: number;
  /** Historiques réels, si disponibles. Sans eux, aucune courbe n'est rendue. */
  history?: {
    revenue?: number[];
    bookings?: number[];
  };
  isLoading?: boolean;
}

export function KpiSection({ stats, pendingConfirmations, history, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[7.5rem] animate-pulse rounded-card bg-neutral-100 sm:h-[9rem]" />
        ))}
      </div>
    );
  }

  const disputes = stats.activeDisputes;

  const kpis: Kpi[] = [
    {
      key: 'revenue',
      label: 'Revenus',
      value: compact.format(stats.revenue),
      unit: 'FCFA',
      icon: TrendingUp,
      history: history?.revenue,
      note: stats.revenue === 0 ? 'Aucun versement pour l’instant' : undefined,
      href: '/dashboard/wallet',
      variant: 'hero',
    },
    {
      key: 'pending',
      // « Réservations actives » affichait pendingConfirmations : en attente
      // de VOTRE réponse n'est pas « en cours ».
      label: 'À confirmer',
      value: plain.format(pendingConfirmations),
      icon: CalendarCheck,
      note: `${plain.format(stats.totalBookings)} réservation${stats.totalBookings > 1 ? 's' : ''} au total`,
      href: pendingConfirmations > 0 ? '/dashboard/reservations?statut=PENDING' : '/dashboard/reservations',
      variant: pendingConfirmations > 0 ? 'alert' : 'default',
    },
    {
      key: 'listings',
      label: 'Annonces en ligne',
      value: plain.format(stats.activeListings),
      icon: Building2,
      note: stats.activeListings === 0 ? 'Publiez votre premier bien' : undefined,
      href: '/dashboard/annonces',
    },
    {
      key: 'disputes',
      label: 'Litiges',
      value: plain.format(disputes),
      icon: AlertTriangle,
      // sub={disputes === 0 ? 'LITIGES' : 'LITIGE'} : le pluriel etait
      // inverse. 0 donnait « LITIGES », 2 donnait « LITIGE ».
      note: disputes === 0 ? 'Aucun litige en cours' : 'Réponse attendue',
      href: '/dashboard/reservations?statut=DISPUTED',
      variant: disputes > 0 ? 'alert' : 'default',
    },
  ];

  return (
    /*
      Une seule grille.

      Les quatre cartes etaient ecrites DEUX fois — une version desktop en
      `hidden sm:grid` et une version mobile en `sm:hidden`, avec des libelles
      legerement differents. Les deux etaient montees simultanement : huit
      cartes, huit minuteurs, cinquante-six barres animees dont la moitie
      invisible. Et toute correction devait etre faite en double.
    */
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <KpiCard key={kpi.key} kpi={kpi} delay={`${i * 60}ms`} />
      ))}
    </div>
  );
}