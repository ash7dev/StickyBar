'use client';

import { DollarSign, TrendingUp, Users, Building2, CalendarCheck, Wallet } from 'lucide-react';
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
}

interface AdminStatsOverviewProps {
  stats?: StatsData;
  isLoading?: boolean;
}

function formatFcfa(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function AdminStatsOverview({ stats, isLoading }: AdminStatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-card border border-border bg-background-alt p-5"
          />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Volume Brut (GMV)',
      value: stats ? formatFcfa(stats.gmv) : '0 FCFA',
      subtext: `${stats?.totalReservations ?? 0} réservations totales`,
      icon: DollarSign,
      iconBg: 'bg-forest-50 border-forest-100 text-forest-700',
      badge: '+12.4%',
      badgePositive: true,
    },
    {
      title: 'Commissions Klef (7%)',
      value: stats ? formatFcfa(stats.commissions) : '0 FCFA',
      subtext: `Revenus nets plateforme`,
      icon: TrendingUp,
      iconBg: 'bg-lime-100 border-lime-200 text-forest-800',
      badge: 'Revenue',
      badgePositive: true,
    },
    {
      title: 'Versements Net Hôtes',
      value: stats ? formatFcfa(stats.payoutsNet) : '0 FCFA',
      subtext: 'Payé via Wave / Orange Money',
      icon: Wallet,
      iconBg: 'bg-purple-50 border-purple-100 text-purple-700',
      badge: 'Mobile Money',
      badgePositive: true,
    },
    {
      title: 'Comptes & Logements',
      value: `${stats?.totalUsers ?? 0} utilisateurs`,
      subtext: `${stats?.activeHosts ?? 0} hôtes · ${stats?.publishedListings ?? 0} annonces`,
      icon: Users,
      iconBg: 'bg-gold-50 border-gold-100 text-gold-700',
      badge: 'Communauté',
      badgePositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="group relative flex flex-col justify-between rounded-card border border-border bg-background-card p-5 shadow-xs transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border shadow-2xs', item.iconBg)}>
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide',
                item.badgePositive
                  ? 'border-forest-200 bg-forest-50 text-forest-800'
                  : 'border-border bg-background-alt text-foreground-muted',
              )}
            >
              {item.badge}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
              {item.title}
            </p>
            <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {item.value}
            </p>
            <p className="mt-1 truncate text-xs text-foreground-muted">
              {item.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
