import { CheckCircle2, Clock, Banknote, AlertTriangle, History } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { dateTime } from '@/features/reservations/utils';
import { DarkCard, DarkCardHeader } from './reservation-cards';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Historique = ReservationDetail['historique'];

const CFG: Record<string, { label: string; icon: typeof CheckCircle2; accent: string }> = {
  PENDING:    { label: 'Réservation créée',     icon: Clock,         accent: 'text-amber-400 bg-amber-400/10 border-amber-400/20'      },
  PAID:       { label: 'Paiement confirmé',     icon: Banknote,      accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  CONFIRMED:  { label: 'Réservation confirmée', icon: CheckCircle2,  accent: 'text-primary-400 bg-primary-400/10 border-primary-400/20' },
  CHECKED_IN: { label: 'Check-in effectué',     icon: CheckCircle2,  accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  COMPLETED:  { label: 'Séjour terminé',        icon: CheckCircle2,  accent: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20' },
  CANCELLED:  { label: 'Annulée',               icon: AlertTriangle, accent: 'text-rose-400 bg-rose-400/10 border-rose-400/20'          },
  DISPUTED:   { label: 'Litige déclaré',        icon: AlertTriangle, accent: 'text-rose-400 bg-rose-400/10 border-rose-400/20'          },
  EXPIRED:    { label: 'Expirée',               icon: Clock,         accent: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20' },
};

export function ReservationTimeline({ historique }: { historique: Historique }) {
  if (historique.length === 0) return null;
  return (
    <DarkCard>
      <DarkCardHeader icon={<History className="w-4 h-4 text-neutral-400" />} title="Chronologie" />
      <div className="p-6">
        <div className="space-y-0">
          {historique.map((event, i) => {
            const cfg = CFG[event.nouveauStatut];
            if (!cfg) return null;
            const Icon = cfg.icon;
            const isLast = i === historique.length - 1;
            return (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn('w-8 h-8 rounded-xl border flex items-center justify-center shrink-0', cfg.accent)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-white/10 my-1.5" />}
                </div>
                <div className={cn('pb-5', isLast && 'pb-0')}>
                  <p className="text-sm font-bold text-white">{cfg.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{dateTime(event.modifieLe)}</p>
                  {event.raison && (
                    <p className="text-xs text-neutral-400 mt-1.5 italic leading-relaxed">{event.raison}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DarkCard>
  );
}
