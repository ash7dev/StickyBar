'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Users, BedDouble, Bath, ArrowRight } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';
import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';

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
  const rating   = listing.note && listing.note > 0 ? listing.note : null;

  return (
    <Link
      href={`/explorer/${listing.id}`}
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
        <div className="flex items-center justify-between mb-1.5">
          {rating ? (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-warning-50 rounded-lg">
              <Star className="w-3 h-3 text-warning-500 fill-warning-500" />
              <span className="text-[11px] font-black text-slate-800">{rating.toFixed(1)}</span>
            </div>
          ) : <div />}
          {listing.capaciteMax > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg">
              <Users className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] font-bold text-slate-700">{listing.capaciteMax} pers.</span>
            </div>
          )}
        </div>

        {/* Titre - agrandi */}
        <h3 className="text-[15px] font-black text-slate-900 leading-[1.3] line-clamp-1 mb-1">
          {listing.titre}
        </h3>

        {/* Specs Airbnb-style : Voyageurs · Chambres · SdB */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1.5 flex-wrap">
          {listing.capaciteMax > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-3 h-3 text-emerald-600 shrink-0" />
              {listing.capaciteMax} voy.
            </span>
          )}
          {listing.nombreChambres ? (
            <>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-0.5">
                <BedDouble className="w-3 h-3 text-emerald-600 shrink-0" />
                {listing.nombreChambres} ch.
              </span>
            </>
          ) : null}
          {listing.nombreSallesBain ? (
            <>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-0.5">
                <Bath className="w-3 h-3 text-emerald-600 shrink-0" />
                {listing.nombreSallesBain} sdb
              </span>
            </>
          ) : null}
        </div>

        {/* Localisation - améliorée */}
        <div className="flex items-center gap-1.5 mb-auto">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
            {location || 'Sénégal'}
          </span>
        </div>

        {/* Prix - design amélioré avec conversion dynamique */}
        <div
          className="flex items-center justify-between mt-3 px-3.5 py-2.5 rounded-[1rem] shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%)' }}
        >
          <TenantPriceDisplay
            prixBase={listing.prixBase}
            derniereMinuteActive={listing.derniereMinuteActive}
            size="sm"
            textColor="text-white"
          />
          <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm">
            <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
        </div>

      </div>
    </Link>
  );
}
