'use client';

import Image from 'next/image';
import { Phone, Lock, PhoneCall, ShieldCheck } from 'lucide-react';
import { canSeeCoordonnees } from '@/features/reservations/utils';
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
    <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
      {/* Avatar + identité */}
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-inner bg-forest-950 text-lime-400 font-display font-extrabold text-base flex items-center justify-center border border-lime-400/20 overflow-hidden shadow-2xs">
            {proprietaire.avatarUrl ? (
              <Image src={proprietaire.avatarUrl} alt="" fill className="object-cover" />
            ) : (
              initiales
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-lime-400 border-2 border-background-card rounded-full" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted mb-0.5">Votre hôte</p>
          <h4 className="font-display text-base font-bold text-forest-950 leading-tight truncate">
            {proprietaire.prenom} {proprietaire.nom}
          </h4>
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-extrabold text-forest-800 bg-forest-50 border border-forest-100 px-2.5 py-0.5 rounded-pill">
            <ShieldCheck className="w-3 h-3 text-forest-600" />
            <span>Propriétaire vérifié</span>
          </span>
        </div>
      </div>

      {/* Téléphone */}
      {canSeePhone && proprietaire.telephone ? (
        <a
          href={`tel:${proprietaire.telephone}`}
          className="flex items-center gap-3.5 w-full bg-forest-950 hover:bg-forest-900 border border-forest-800 rounded-inner p-3.5 transition-all group"
        >
          <div className="w-9 h-9 rounded-inner bg-lime-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <PhoneCall className="w-4 h-4 text-forest-950" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-forest-200">Appeler l&apos;hôte</p>
            <p className="text-sm font-mono font-extrabold text-lime-300 tracking-wide">{proprietaire.telephone}</p>
          </div>
        </a>
      ) : (
        <div className="flex items-center gap-3.5 bg-background-alt border border-border/80 rounded-inner p-3.5">
          <div className="w-9 h-9 rounded-inner bg-background-card border border-border flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-foreground-faint" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-forest-950">Numéro masqué</p>
            <p className="text-[10px] text-foreground-muted mt-0.5 leading-relaxed">
              {['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(statut)
                ? 'Non disponible pour cette réservation'
                : 'Visible 24h avant votre arrivée'}
            </p>
          </div>
          <Phone className="w-4 h-4 text-foreground-faint shrink-0" />
        </div>
      )}
    </div>
  );
}
