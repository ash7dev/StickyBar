import { AlertTriangle } from 'lucide-react';
import { formatFCFA } from '../lib/transaction-labels';

interface Props {
  dettePenalites: number;
}

export function DebtWarningBanner({ dettePenalites }: Props) {
  if (dettePenalites <= 0) return null;

  return (
    <div className="rounded-card border border-error-500/30 bg-error-50 dark:bg-error-700/10 p-5 sm:p-6 relative overflow-hidden transition-all shadow-xs">
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-inner bg-error-500/15 border border-error-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-error-600 dark:text-error-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-error-700 dark:text-error-500 mb-1">
            Dette de pénalité en cours — <span className="tabular-nums">{formatFCFA(dettePenalites)}</span>
          </h4>
          <p className="text-xs sm:text-sm font-normal text-error-700/80 dark:text-error-500/80 leading-relaxed">
            Cette dette sera automatiquement prélevée sur le versement de votre prochaine location.
            Elle fait suite à une pénalité d'annulation appliquée alors que votre solde disponible était insuffisant.
          </p>
        </div>
      </div>
    </div>
  );
}
