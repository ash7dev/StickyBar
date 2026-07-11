import Image from 'next/image';
import { Moon, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa, dateLong } from '@/features/reservations/utils';
import { DarkCard } from '../shared/reservation-cards';
import type { ReservationDetail } from '@/lib/nestjs/types';

const STATUT_CFG: Record<string, {
  label: string;
  gradient: string;
  badge: string;
  dot: string;
  icon: typeof CheckCircle2;
}> = {
  PENDING:    { label: 'En attente',      gradient: 'from-amber-400 to-amber-500',     badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',       dot: 'bg-amber-400',   icon: Clock         },
  PAID:       { label: 'Paiement reçu',   gradient: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400', icon: CheckCircle2  },
  CONFIRMED:  { label: 'Confirmée',       gradient: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400', icon: CheckCircle2  },
  CHECKED_IN: { label: 'Séjour en cours', gradient: 'from-emerald-400 to-teal-500',    badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400', icon: CheckCircle2  },
  COMPLETED:  { label: 'Terminée',        gradient: 'from-neutral-500 to-neutral-600', badge: 'bg-neutral-400/10 text-neutral-400 border-neutral-400/20', dot: 'bg-neutral-400', icon: CheckCircle2  },
  CANCELLED:  { label: 'Annulée',         gradient: 'from-rose-500 to-rose-600',       badge: 'bg-rose-400/15 text-rose-300 border-rose-400/30',          dot: 'bg-rose-400',    icon: AlertTriangle },
  DISPUTED:   { label: 'Litige',          gradient: 'from-rose-600 to-red-700',        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',          dot: 'bg-rose-500',    icon: AlertTriangle },
  EXPIRED:    { label: 'Expirée',         gradient: 'from-neutral-400 to-neutral-500', badge: 'bg-neutral-400/10 text-neutral-400 border-neutral-400/20', dot: 'bg-neutral-400', icon: Clock         },
};

export function TenantReservationHero({ res }: { res: ReservationDetail }) {
  const cfg = STATUT_CFG[res.statut] ?? STATUT_CFG.PENDING;
  const StatusIcon = cfg.icon;
  const mainPhoto = res.logement.photos.find((p) => p.estPrincipale)?.url ?? res.logement.photos[0]?.url;

  return (
    <DarkCard className="rounded-3xl">
      <div className={cn('h-0.5 w-full bg-gradient-to-r', cfg.gradient)} />
      <div className="relative overflow-hidden">
        {/* Glow de fond */}
        <div className={cn('absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-8 blur-3xl bg-gradient-to-br', cfg.gradient)} />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">

            {/* Colonne gauche */}
            <div className="flex-1 min-w-0 space-y-5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold backdrop-blur-sm', cfg.badge)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', cfg.dot)} />
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
                <span className="text-xs text-neutral-500 font-medium">Créée le {dateLong(res.creeLe)}</span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                  {res.logement.type} · {res.logement.ville}
                  {res.logement.quartier ? ` · ${res.logement.quartier}` : ''}
                </p>
                <h1 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                  {res.logement.titre}
                </h1>
              </div>

              {/* Widget dates */}
              <div className="flex items-stretch bg-white/6 border border-white/10 rounded-2xl overflow-hidden w-full max-w-sm backdrop-blur-sm">
                <div className="flex-1 px-5 py-3.5 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Arrivée</p>
                  <p className="text-sm font-bold text-white">{dateLong(res.dateDebut)}</p>
                </div>
                <div className="flex flex-col items-center justify-center px-4 border-x border-white/10 gap-0.5">
                  <Moon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-base font-black text-white tabular-nums leading-none">{res.nbNuits}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase">nuit{res.nbNuits > 1 ? 's' : ''}</span>
                </div>
                <div className="flex-1 px-5 py-3.5 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Départ</p>
                  <p className="text-sm font-bold text-white">{dateLong(res.dateFin)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-400">
                <Users className="w-4 h-4 text-neutral-500" />
                {res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}
              </div>
            </div>

            {/* Colonne droite : photo + KPI */}
            <div className="flex flex-col gap-3 md:w-56 shrink-0">
              {mainPhoto && (
                <div className="relative w-full h-36 md:h-44 rounded-2xl overflow-hidden bg-white/6 border border-white/10">
                  <Image src={mainPhoto} alt={res.logement.titre} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}
              <div className="rounded-2xl bg-white/6 border border-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Total payé</p>
                <p className="text-3xl font-black text-emerald-400 tracking-tight leading-none">{fcfa(res.totalLocataire)}</p>
                <p className="text-[10px] font-bold text-neutral-600 mt-0.5">FCFA</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DarkCard>
  );
}
