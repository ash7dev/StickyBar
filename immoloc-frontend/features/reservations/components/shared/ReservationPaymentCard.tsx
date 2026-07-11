import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa } from '@/features/reservations/utils';
import { DarkCard, DarkCardHeader } from './reservation-cards';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Paiement = ReservationDetail['paiement'];

const FOURNISSEUR_LABEL: Record<string, string> = {
  WAVE:         'Wave',
  ORANGE_MONEY: 'Orange Money',
  PAYDUNYA:     'PayDunya',
  STRIPE:       'Carte bancaire',
};

const FOURNISSEUR_BADGE: Record<string, string> = {
  WAVE:         'bg-sky-400/10 text-sky-300 border-sky-400/20',
  ORANGE_MONEY: 'bg-orange-400/10 text-orange-300 border-orange-400/20',
  PAYDUNYA:     'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  STRIPE:       'bg-violet-400/10 text-violet-300 border-violet-400/20',
};

export function ReservationPaymentCard({ paiement }: { paiement: Paiement }) {
  if (!paiement) return null;
  return (
    <DarkCard>
      <DarkCardHeader icon={<CreditCard className="w-4 h-4 text-neutral-400" />} title="Paiement" />
      <div className="p-6">
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-2.5">Moyen de paiement</p>
            <span className={cn('inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold', FOURNISSEUR_BADGE[paiement.fournisseur])}>
              {FOURNISSEUR_LABEL[paiement.fournisseur]}
            </span>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-2.5">Statut</p>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold',
              paiement.statut === 'CONFIRME'
                ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'
                : 'bg-amber-400/10 text-amber-300 border-amber-400/20',
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', paiement.statut === 'CONFIRME' ? 'bg-emerald-400' : 'bg-amber-400')} />
              {paiement.statut === 'CONFIRME' ? 'Confirmé' : paiement.statut}
            </span>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-2.5">Montant</p>
            <p className="text-2xl font-black text-white tracking-tight">
              {fcfa(paiement.montant)} <span className="text-xs font-bold text-neutral-500">FCFA</span>
            </p>
          </div>
        </div>
      </div>
    </DarkCard>
  );
}
