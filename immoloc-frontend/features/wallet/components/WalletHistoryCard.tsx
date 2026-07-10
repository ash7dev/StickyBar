import { History } from 'lucide-react';
import type { WalletTransaction } from '@/lib/nestjs';
import { TransactionHistory, TransactionHistorySkeleton } from './TransactionHistory';

interface Props {
  transactions?: WalletTransaction[];
  isLoading: boolean;
}

export function WalletHistoryCard({ transactions, isLoading }: Props) {
  return (
    <div className="bg-background-card rounded-2xl border border-border p-4 sm:p-7 relative overflow-hidden hover:shadow-lg transition-all duration-300 w-full">
      <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-2 mb-4 sm:mb-6 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground-muted" />
        </div>
        <h2 className="text-sm sm:text-base font-bold text-foreground truncate">Historique</h2>
        <span className="ml-auto text-[10px] sm:text-xs font-medium text-foreground-muted flex-shrink-0">20 dernières</span>
      </div>

      <div className="relative z-10 min-w-0">
        {isLoading || !transactions ? (
          <TransactionHistorySkeleton />
        ) : (
          <TransactionHistory transactions={transactions} />
        )}
      </div>
    </div>
  );
}
