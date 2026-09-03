import { History } from 'lucide-react';
import type { WalletTransaction } from '@/lib/nestjs';
import { TransactionHistory, TransactionHistorySkeleton } from './TransactionHistory';

interface Props {
  transactions?: WalletTransaction[];
  isLoading: boolean;
}

export function WalletHistoryCard({ transactions, isLoading }: Props) {
  return (
    <div className="card p-4 sm:p-7 relative overflow-hidden transition-all w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-inner bg-forest-950 border border-forest-800 text-on-inverse-marker flex items-center justify-center shrink-0 shadow-sm">
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-on-inverse-marker" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base sm:text-lg font-semibold text-foreground truncate">Historique des transactions</h2>
            <p className="text-[11px] sm:text-xs text-foreground-muted">Activité financière en temps réel</p>
          </div>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold text-foreground-muted bg-background-alt px-2.5 py-1 rounded-pill border border-border shrink-0">
          20 dernières
        </span>
      </div>

      <div className="min-w-0">
        {isLoading || !transactions ? (
          <TransactionHistorySkeleton />
        ) : (
          <TransactionHistory transactions={transactions} />
        )}
      </div>
    </div>
  );
}
