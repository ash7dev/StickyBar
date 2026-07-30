'use client';

import { Wallet, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatFCFA } from '../lib/transaction-labels';

interface Props {
  soldeDisponible: number;
  dettePenalites: number;
}

export function WalletBalanceCard({ soldeDisponible, dettePenalites }: Props) {
  const hasDebt = dettePenalites > 0;

  return (
    <div className="section-inverse relative overflow-hidden p-6 sm:p-8 shadow-xl transition-all duration-300">
      {/* Halo radial de fond (Signature visuelle Klef) */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-forest-700/30 rounded-full blur-[70px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-lime-400/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-inner bg-forest-800/80 border border-border-inverse flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-lime-300" />
            </div>
            <span className="eyebrow text-on-inverse-muted">
              Solde disponible
            </span>
          </div>

          <p className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-inverse-display tracking-tight tabular-nums mt-1">
            {formatFCFA(soldeDisponible)}
          </p>

          {hasDebt && (
            <div className="flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-pill bg-error-500/20 border border-error-500/30 w-fit">
              <AlertTriangle className="w-4 h-4 text-error-500" />
              <span className="text-xs font-semibold text-on-inverse">
                Dette en cours : {formatFCFA(dettePenalites)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-pill bg-forest-800/60 border border-border-inverse text-xs font-semibold text-lime-300 shadow-2xs">
            <TrendingUp className="w-4 h-4 text-lime-400" />
            <span>Portefeuille Actif</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletBalanceCardSkeleton() {
  return (
    <div className="section-inverse p-6 sm:p-8 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-inner bg-forest-800/60" />
        <div className="h-4 w-32 bg-forest-800/80 rounded-pill" />
      </div>
      <div className="h-10 w-56 bg-forest-800/80 rounded-card" />
    </div>
  );
}
