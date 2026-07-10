import Image from 'next/image';
import { Home, MapPin } from 'lucide-react';
import { GlassCard, GlassCardHeader } from '../shared/reservation-cards';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Logement = ReservationDetail['logement'];

export function TenantPropertyCard({ logement }: { logement: Logement }) {
  const mainPhoto = logement.photos.find((p) => p.estPrincipale)?.url ?? logement.photos[0]?.url;

  return (
    <GlassCard>
      <GlassCardHeader icon={<Home className="w-4 h-4 text-neutral-600" />} title="Logement" />
      <div className="p-5 space-y-4">
        {mainPhoto && (
          <div className="relative w-full h-32 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60">
            <Image src={mainPhoto} alt={logement.titre} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-neutral-900">{logement.titre}</p>
          <p className="text-xs font-semibold text-neutral-400 mt-0.5">{logement.type}</p>
        </div>
        <div className="flex items-start gap-2.5 pt-3 border-t border-neutral-200/60">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {logement.adresse}
            {logement.quartier ? `, ${logement.quartier}` : ''}
            {`, ${logement.ville}`}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
