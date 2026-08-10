'use client';

import { TrendingUp, DollarSign, Percent, ShieldAlert, CheckCircle2, ShoppingBag, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SummaryData {
  netKlefRevenue: number;
  commissionsTotal: number;
  penaltiesTotal: number;
  totalGmv: number;
  hostPayoutsTotal: number;
  reservationCount: number;
}

interface AdminStatsKpiGridProps {
  summary?: SummaryData;
  isLoading: boolean;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "0 FCFA";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

export function AdminStatsKpiGrid({ summary, isLoading }: AdminStatsKpiGridProps) {
  const gmv = summary?.totalGmv ?? 0;
  const count = summary?.reservationCount ?? 0;
  const averageBasket = count > 0 ? Math.round(gmv / count) : 0;
  const hostPayouts = summary?.hostPayoutsTotal ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* 1. Revenu Net Klef */}
      <div className="rounded-card border border-forest-300 bg-forest-50/50 p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-900">
            Revenu Net Klef
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-forest-600 text-neutral-0 shadow-2xs">
            <TrendingUp className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-xl font-extrabold text-forest-950 tabular-nums">
          {isLoading ? "..." : formatPrice(summary?.netKlefRevenue)}
        </p>
        <p className="text-[10px] text-forest-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-forest-600 shrink-0" />
          Commissions (7%) + Pénalités
        </p>
      </div>

      {/* 2. Volume Brut Total (GMV) */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
            Volume Brut (GMV)
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-background-alt border border-border text-foreground-muted">
            <DollarSign className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-xl font-extrabold text-foreground tabular-nums">
          {isLoading ? "..." : formatPrice(gmv)}
        </p>
        <p className="text-[10px] text-foreground-muted">
          Sur {count} séjour{count > 1 ? 's' : ''} traités
        </p>
      </div>

      {/* 3. Reversé aux Hôtes (93% Net) */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
            Reversé Hôtes (93%)
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-forest-50 border border-forest-100 text-forest-700">
            <Wallet className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-xl font-extrabold text-forest-900 tabular-nums">
          {isLoading ? "..." : formatPrice(hostPayouts)}
        </p>
        <p className="text-[10px] text-foreground-muted">
          100% garanti et versé
        </p>
      </div>

      {/* 4. Panier Moyen (Ticket Moyen) */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
            Panier Moyen / Séjour
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-gold-400/20 border border-gold-400/30 text-gold-700">
            <ShoppingBag className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-xl font-extrabold text-foreground tabular-nums">
          {isLoading ? "..." : formatPrice(averageBasket)}
        </p>
        <p className="text-[10px] text-foreground-muted">
          Valeur moyenne d’une réservation
        </p>
      </div>

      {/* 5. Commissions Séjours (7%) */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
            Commissions 7%
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-background-alt border border-border text-forest-700">
            <Percent className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-xl font-extrabold text-foreground tabular-nums">
          {isLoading ? "..." : formatPrice(summary?.commissionsTotal)}
        </p>
        <p className="text-[10px] text-foreground-muted">
          Frais de service plateforme
        </p>
      </div>

      {/* 6. Pénalités & Annulations */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
            Pénalités Retenues
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-warning-50 border border-warning-200 text-warning-800">
            <ShieldAlert className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-xl font-extrabold text-foreground tabular-nums">
          {isLoading ? "..." : formatPrice(summary?.penaltiesTotal)}
        </p>
        <p className="text-[10px] text-foreground-muted">
          Arbitrage & Annulations
        </p>
      </div>
    </div>
  );
}
