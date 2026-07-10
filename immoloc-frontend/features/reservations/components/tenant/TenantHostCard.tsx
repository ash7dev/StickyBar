import Image from 'next/image';
import { Phone, Lock, PhoneCall } from 'lucide-react';
import { canSeeCoordonnees } from '@/features/reservations/utils';
import { GlassCard } from '../shared/reservation-cards';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Proprietaire = ReservationDetail['proprietaire'];

interface Props {
  proprietaire: Proprietaire;
  statut: string;
  dateDebut: string;
}

export function TenantHostCard({ proprietaire, statut, dateDebut }: Props) {
  const canSeePhone = canSeeCoordonnees(statut, dateDebut);
  const initiales = `${proprietaire.prenom[0]}${proprietaire.nom[0]}`.toUpperCase();

  return (
    <GlassCard>
      <div className="p-5 space-y-5">

        {/* Avatar + identité */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-primary-500/25 overflow-hidden">
              {proprietaire.avatarUrl
                ? <Image src={proprietaire.avatarUrl} alt="" fill className="object-cover" />
                : initiales}
            </div>
            {/* Pastille verte "actif" */}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Votre hôte</p>
            <p className="text-base font-black text-neutral-900 leading-tight truncate">
              {proprietaire.prenom} {proprietaire.nom}
            </p>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
              Propriétaire vérifié
            </span>
          </div>
        </div>

        {/* Téléphone */}
        {canSeePhone && proprietaire.telephone ? (
          <a
            href={`tel:${proprietaire.telephone}`}
            className="flex items-center gap-3 w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-2xl px-4 py-3.5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center shrink-0 transition-colors shadow-sm shadow-emerald-500/30">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Appeler l&apos;hôte</p>
              <p className="text-sm font-black text-emerald-800 tracking-wide">{proprietaire.telephone}</p>
            </div>
          </a>
        ) : (
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500">Numéro masqué</p>
              <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                {['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(statut)
                  ? 'Non disponible pour cette réservation'
                  : 'Visible 24h avant votre arrivée'}
              </p>
            </div>
            <div className="ml-auto">
              <Phone className="w-4 h-4 text-neutral-300" />
            </div>
          </div>
        )}

      </div>
    </GlassCard>
  );
}
