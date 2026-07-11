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
    <div className="bg-emerald-800 border border-rose-500/20 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
      <div className="h-0.5 bg-gradient-to-r from-rose-500 to-red-600 w-full" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-sm font-bold text-white">Litige en cours</span>
          <span className="ml-auto text-[10px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            {STATUT_LITIGE_LABEL[litige.statut] ?? litige.statut}
          </span>
        </div>
        <p className="text-sm font-semibold text-rose-300">{litige.motif}</p>
        <p className="text-xs text-neutral-400 leading-relaxed">{litige.description}</p>
      </div>
    </div>
  );
}
