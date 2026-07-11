'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Users, ArrowRight } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  STUDIO:      'Studio',
  VILLA:       'Villa',
  CHAMBRE:     'Chambre',
  DUPLEX:      'Duplex',
  PENTHOUSE:   'Penthouse',
  AUTRES:      'Autre',
};

export function MobileLogementsCard({ listing }: { listing: Listing }) {
  const photo    = listing.photos.find((p) => p.estPrincipale)?.url ?? listing.photos[0]?.url;
  const location = [listing.quartier, listing.ville].filter(Boolean).join(', ');
  const price    = Math.round(Number(listing.prixBase) * 1.07).toLocaleString('fr-FR');
  const rating   = listing.note && listing.note > 0 ? listing.note : null;

  return (
    <Link
      href={`/logements/${listing.id}`}
      className="flex rounded-[1.8rem] overflow-hidden bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] active:scale-[0.97] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      {/* Photo — gauche, format optimisé */}
      <div className="relative w-[140px] shrink-0 bg-gradient-to-br from-neutral-100 to-neutral-200">
        {photo ? (
          <Image
            src={photo}
            alt={listing.titre}
            fill
            className="object-cover"
            sizes="140px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

        {/* Type badge - repositionné et amélioré */}
        <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[9px] font-black text-slate-900 uppercase tracking-wider shadow-lg">
          {TYPE_LABELS[listing.type] ?? listing.type}
        </span>
      </div>

      {/* Infos — droite */}
      <div className="flex flex-col flex-1 min-w-0 px-4 py-3.5">

        {/* Rating + capacité - améliorés */}
        <div className="flex items-center justify-between mb-2">
          {rating ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-warning-50 rounded-lg">
              <Star className="w-3 h-3 text-warning-500 fill-warning-500" />
              <span className="text-[11px] font-black text-slate-800">{rating.toFixed(1)}</span>
            </div>
          ) : <div />}
          {listing.capaciteMax > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
              <Users className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] font-bold text-slate-700">{listing.capaciteMax} pers.</span>
            </div>
          )}
        </div>

        {/* Titre - agrandi */}
        <h3 className="text-[15px] font-black text-slate-900 leading-[1.4] line-clamp-2 mb-2">
          {listing.titre}
        </h3>

        {/* Localisation - améliorée */}
        <div className="flex items-center gap-1.5 mb-auto">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
            {location || 'Sénégal'}
          </span>
        </div>

        {/* Prix - design amélioré */}
        <div
          className="flex items-center justify-between mt-3 px-3.5 py-2.5 rounded-[1rem] shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%)' }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[16px] font-black text-white leading-none tracking-tight">{price}</span>
            <span className="text-[8px] font-bold text-white/70 uppercase tracking-wide">FCFA/nuit</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm">
            <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
        </div>

      </div>
    </Link>
  );
}
