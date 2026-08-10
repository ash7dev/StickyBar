'use client';

import { TrendingUp, DollarSign, Percent, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Revenu Net Klef */}
      <div className="rounded-card border border-forest-300 bg-forest-50/40 p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-forest-800">
            Revenu Net Plateforme (Klef)
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-600 text-neutral-0 shadow-2xs">
            <TrendingUp className="h-5 w-5" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-forest-950">
          {isLoading ? "..." : formatPrice(summary?.netKlefRevenue)}
        </p>
        <p className="text-[0.6875rem] text-forest-700 font-medium flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-forest-600" />
          Commissions (7%) + Pénalités perçues
        </p>
      </div>

      {/* 2. Commissions Réservations */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
            Commissions Réservations (7%)
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-background-alt border border-border text-forest-700">
            <Percent className="h-5 w-5" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">
          {isLoading ? "..." : formatPrice(summary?.commissionsTotal)}
        </p>
        <p className="text-[0.6875rem] text-foreground-muted">
          Sur {summary?.reservationCount ?? 0} séjours confirmés/effectués
        </p>
      </div>

      {/* 3. Pénalités & Retentions */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
            Pénalités & Annulations
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-warning-50 border border-warning-200 text-warning-800">
            <ShieldAlert className="h-5 w-5" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">
          {isLoading ? "..." : formatPrice(summary?.penaltiesTotal)}
        </p>
        <p className="text-[0.6875rem] text-foreground-muted">
          Débits pour pénalités et frais d'arbitrage
        </p>
      </div>

      {/* 4. Volume Brut Transacté (GMV) */}
      <div className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
            Volume Brut Total (GMV)
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-background-alt border border-border text-foreground-muted">
            <DollarSign className="h-5 w-5" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">
          {isLoading ? "..." : formatPrice(summary?.totalGmv)}
        </p>
        <p className="text-[0.6875rem] text-foreground-muted">
          Dont {formatPrice(summary?.hostPayoutsTotal)} reversés aux hôtes
        </p>
      </div>
    </div>
  );
}
