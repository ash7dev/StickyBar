import { ArrowDownToLine } from 'lucide-react';
import { WithdrawalForm } from './WithdrawalForm';

interface Props {
  soldeDisponible: number;
  isLoading: boolean;
}

export function WalletWithdrawalCard({ soldeDisponible, isLoading }: Props) {
  return (
    <div className="bg-background-card rounded-2xl border border-border p-4 sm:p-7 lg:sticky lg:top-24 relative overflow-hidden hover:shadow-lg transition-all duration-300 w-full">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-2 mb-4 sm:mb-6 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <ArrowDownToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
        </div>
        <h2 className="text-sm sm:text-base font-bold text-foreground truncate">Demander un retrait</h2>
      </div>

      <div className="relative z-10 min-w-0">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[80, 60, 70].map((w, i) => (
              <div key={i} className={`h-12 bg-background-alt rounded-xl w-${w === 80 ? 'full' : `${w}%`}`} />
            ))}
          </div>
        ) : (
          <WithdrawalForm soldeDisponible={soldeDisponible} />
        )}
      </div>
    </div>
  );
}
