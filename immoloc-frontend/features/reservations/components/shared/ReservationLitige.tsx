import { AlertTriangle } from 'lucide-react';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Litige = ReservationDetail['litige'];

const STATUT_LITIGE_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  FONDE:      'Fondé',
  NON_FONDE:  'Non fondé',
};

export function ReservationLitige({ litige }: { litige: Litige }) {
  if (!litige) return null;
  return (
    <div className="bg-forest-950 border border-rose-500/30 rounded-card overflow-hidden shadow-md text-white">
      <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-700 w-full" />
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-inner bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="font-display text-sm font-bold text-white">Litige en cours</span>
          <span className="ml-auto text-[10px] font-extrabold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-pill">
            {STATUT_LITIGE_LABEL[litige.statut] ?? litige.statut}
          </span>
        </div>
        <p className="text-sm font-bold text-rose-300">{litige.motif}</p>
        <p className="text-xs text-forest-300 leading-relaxed">{litige.description}</p>
      </div>
    </div>
  );
}
