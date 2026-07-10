import { AlertTriangle } from 'lucide-react';
import { formatFCFA } from '../lib/transaction-labels';

interface Props {
  dettePenalites: number;
}

export function DebtWarningBanner({ dettePenalites }: Props) {
  if (dettePenalites <= 0) return null;

  return (
    <div className="rounded-2xl border border-error-200 bg-error-50 p-5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_50%,var(--error-500)/8,transparent)] pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-error-100 border border-error-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-[18px] h-[18px] text-error-600" />
        </div>
        <div>
          <p className="text-sm font-black text-error-700 mb-1">
            Dette en cours — {formatFCFA(dettePenalites)}
          </p>
          <p className="text-sm font-medium text-error-600 leading-relaxed">
            Cette dette sera automatiquement déduite de votre prochain revenu de location.
            Elle provient d'une pénalité appliquée alors que votre solde était insuffisant.
          </p>
        </div>
      </div>
    </div>
  );
}
