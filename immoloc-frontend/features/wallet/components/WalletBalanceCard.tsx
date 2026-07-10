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
    <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl overflow-hidden border border-primary-400/20 p-7 hover:shadow-xl transition-all duration-500">
      {/* Ambient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-background-card/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary-400/20 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-background-card/15 backdrop-blur-sm border border-background-card/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-background-card" />
            </div>
            <span className="text-sm font-bold text-background-card/70 uppercase tracking-wider">
              Solde disponible
            </span>
          </div>

          <p className="text-4xl font-black text-background-card tracking-tight tabular-nums">
            {formatFCFA(soldeDisponible)}
          </p>

          {hasDebt && (
            <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-warning-500/20 backdrop-blur-sm border border-warning-400/30 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 text-warning-100" />
              <span className="text-xs font-bold text-warning-50">
                Dette : {formatFCFA(dettePenalites)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-card/15 backdrop-blur-sm border border-background-card/20">
            <TrendingUp className="w-3.5 h-3.5 text-background-card" />
            <span className="text-xs font-bold text-background-card">Actif</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletBalanceCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl border border-primary-400/20 p-7 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-background-card/10" />
        <div className="h-3 w-28 bg-background-card/20 rounded-full" />
      </div>
      <div className="h-10 w-48 bg-background-card/20 rounded-xl" />
    </div>
  );
}
