import { History } from 'lucide-react';
import type { WalletTransaction } from '@/lib/nestjs';
import { TransactionHistory, TransactionHistorySkeleton } from './TransactionHistory';

interface Props {
  transactions?: WalletTransaction[];
  isLoading: boolean;
}

export function WalletHistoryCard({ transactions, isLoading }: Props) {
  return (
    <div className="card p-5 sm:p-7 relative overflow-hidden transition-all w-full">
      <div className="flex items-center gap-3 mb-6 min-w-0">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-on-inverse-marker flex items-center justify-center shrink-0 shadow-sm">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground truncate">Historique des transactions</h2>
          <p className="text-xs text-foreground-muted">Activité financière en temps réel</p>
        </div>
        <span className="ml-auto text-xs font-semibold text-foreground-muted bg-background-alt px-3 py-1 rounded-pill border border-border shrink-0">
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
