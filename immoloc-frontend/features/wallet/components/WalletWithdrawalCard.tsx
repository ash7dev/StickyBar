import { ArrowDownToLine } from 'lucide-react';
import { WithdrawalForm } from './WithdrawalForm';

interface Props {
  soldeDisponible: number;
  isLoading: boolean;
}

export function WalletWithdrawalCard({ soldeDisponible, isLoading }: Props) {
  return (
    <div className="card p-5 sm:p-7 lg:sticky lg:top-24 relative overflow-hidden transition-all w-full">
      <div className="flex items-center gap-3 mb-6 min-w-0">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-sm">
          <ArrowDownToLine className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground truncate">Demander un retrait</h2>
          <p className="text-xs text-foreground-muted">Transfert immédiat vers Wave ou Orange Money</p>
        </div>
      </div>

      <div className="min-w-0">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-background-alt rounded-field w-full" />
            <div className="h-12 bg-background-alt rounded-field w-full" />
            <div className="h-12 bg-background-alt rounded-pill w-full" />
          </div>
        ) : (
          <WithdrawalForm soldeDisponible={soldeDisponible} />
        )}
      </div>
    </div>
  );
}
