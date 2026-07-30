'use client';

import Image from 'next/image';
import { Home, MapPin } from 'lucide-react';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Logement = ReservationDetail['logement'];

export function TenantPropertyCard({ logement }: { logement: Logement }) {
  const mainPhoto = logement.photos.find((p) => p.estPrincipale)?.url ?? logement.photos[0]?.url;

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
        <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
          <Home className="w-4 h-4 text-lime-400" />
        </div>
        <div>
          <h4 className="font-display text-base font-bold text-forest-950">Logement loué</h4>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground-muted">{logement.type}</p>
        </div>
      </div>

      <div className="space-y-3">
        {mainPhoto && (
          <div className="relative w-full h-32 rounded-inner overflow-hidden border border-border bg-background-alt shadow-2xs">
            <Image src={mainPhoto} alt={logement.titre} fill className="object-cover" />
          </div>
        )}

        <div>
          <h5 className="font-display text-base font-bold text-forest-950 leading-snug">
            {logement.titre}
          </h5>
        </div>

        <div className="flex items-start gap-2.5 pt-3 border-t border-border/60 text-xs text-foreground-muted">
          <div className="w-7 h-7 rounded-inner bg-forest-50 border border-forest-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-forest-700" />
          </div>
          <p className="leading-relaxed text-forest-950 font-medium">
            {logement.adresse}
            {logement.quartier ? `, ${logement.quartier}` : ''}
            {`, ${logement.ville}`}
          </p>
        </div>
      </div>
    </div>
  );
}
