'use client';

import { DollarSign, TrendingUp, Users, Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatsData {
  gmv: number;
  commissions: number;
  payoutsNet: number;
  totalReservations: number;
  totalUsers: number;
  activeHosts: number;
  publishedListings: number;
  completedStays: number;
  /* Variations sur la période précédente, en pourcentage. Optionnelles :
     tant que l'API ne les renvoie pas, aucun badge ne s'affiche.
     ⚠️ Le `+12.4%` précédent était écrit en dur dans le composant : il ne
     provenait d'aucune donnée et ne changeait jamais, sur l'écran où tu
     prends tes décisions. */
  gmvVariation?: number;
  commissionsVariation?: number;
  payoutsVariation?: number;
  usersVariation?: number;
}

interface Props {
  stats?: StatsData;
  isLoading?: boolean;
}

const fcfa = (amount?: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(amount) || 0)} FCFA`;

const nombre = (n?: number) => new Intl.NumberFormat('fr-FR').format(Number(n) || 0);

function Variation({ value }: { value?: number }) {
  if (value === undefined || Number.isNaN(value)) return null;

  const positive = value > 0;
  const neutral = value === 0;
  const Icon = positive ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold tabular-nums',
        neutral
          ? 'border-border bg-background-alt text-foreground-muted'
          : positive
            ? 'border-success-500/25 bg-success-50 text-success-700'
            : 'border-error-500/25 bg-error-50 text-error-700',
      )}
    >
      {!neutral && <Icon className="h-3 w-3" aria-hidden="true" />}
      {positive ? '+' : ''}{value.toFixed(1).replace('.', ',')} %
    </span>
  );
}

export function AdminStatsOverview({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-card border border-border bg-background-alt" />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Volume brut',
      value: fcfa(stats?.gmv),
      subtext: `${nombre(stats?.totalReservations)} réservation${(stats?.totalReservations ?? 0) > 1 ? 's' : ''}`,
      icon: DollarSign,
      /* `bg-lime-100` et `bg-purple-50` : le lime signale l'action, et purple
         n'est pas dans la palette. Les quatre pastilles s'unifient — leur
         rôle est d'identifier, pas de hiérarchiser. */
      tone: 'border-forest-100 bg-forest-50 text-forest-700',
      variation: stats?.gmvVariation,
    },
    {
      title: 'Commissions Klef',
      value: fcfa(stats?.commissions),
      subtext: 'Revenus de la plateforme',
      icon: TrendingUp,
      tone: 'border-gold-200 bg-gold-50 text-gold-700',
      variation: stats?.commissionsVariation,
    },
    {
      title: 'Versé aux hôtes',
      value: fcfa(stats?.payoutsNet),
      subtext: 'Via Wave et Orange Money',
      icon: Wallet,
      tone: 'border-forest-100 bg-forest-50 text-forest-700',
      variation: stats?.payoutsVariation,
    },
    {
      title: 'Comptes',
      value: nombre(stats?.totalUsers),
      subtext: `${nombre(stats?.activeHosts)} hôtes · ${nombre(stats?.publishedListings)} annonces`,
      icon: Users,
      tone: 'border-forest-100 bg-forest-50 text-forest-700',
      variation: stats?.usersVariation,
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ title, value, subtext, icon: Icon, tone, variation }) => (
        <div
          key={title}
          className="flex flex-col justify-between rounded-card border border-border bg-background-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border', tone)}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <Variation value={variation} />
          </div>

          <div className="mt-4 min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {title}
            </dt>
            <dd className="mt-1 font-display text-xl font-semibold tracking-tight tabular-nums text-foreground sm:text-2xl">
              {value}
            </dd>
            <p className="mt-1 truncate text-xs tabular-nums text-foreground-muted">
              {subtext}
            </p>
          </div>
        </div>
      ))}
    </dl>
  );
}