'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Users, ArrowRight, Images, ImageOff } from 'lucide-react';
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

export function MobileListingGridCard({ listing }: { listing: Listing }) {
  const mainPhoto = listing.photos.find((p) => p.estPrincipale) ?? listing.photos[0];
  const location = [listing.quartier, listing.ville].filter(Boolean).join(', ');
  const price = Math.round(Number(listing.prixBase) * 1.07).toLocaleString('fr-FR');
  const rating = listing.note && listing.note > 0 ? Number(listing.note) : null;

  return (
    <Link
      href={`/logements/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-border bg-background-card shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image — même ratio 4/3 que desktop */}
      <div className="relative w-full shrink-0 aspect-[4/3] bg-gradient-to-br from-background-alt to-border overflow-hidden">
        {mainPhoto ? (
          <Image
            src={mainPhoto.url}
            alt={listing.titre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <ImageOff className="w-7 h-7 text-neutral-300" />
            <span className="text-[9px] text-foreground-muted font-semibold uppercase tracking-wider">
              Aucune photo
            </span>
          </div>
        )}

        {/* Overlay gradient — identique desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-overlay-light via-transparent to-overlay-light/30 pointer-events-none" />

        {/* Type badge */}
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-background-card/95 backdrop-blur-sm px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-foreground shadow-lg">
          {TYPE_LABELS[listing.type] ?? listing.type}
        </span>

        {/* Rating */}
        {rating && (
          <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-background-card/95 backdrop-blur-sm px-2 py-1 shadow-lg">
            <Star className="h-3 w-3 text-warning-500 fill-warning-500" />
            <span className="text-[9px] font-black text-foreground">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Photo count */}
        {listing.photos.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 bg-overlay backdrop-blur-md rounded-full">
            <Images className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] font-bold text-white">{listing.photos.length}</span>
          </div>
        )}

        {/* Capacité badge */}
        {listing.capaciteMax > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 bg-overlay backdrop-blur-md rounded-full">
            <Users className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] font-bold text-white">{listing.capaciteMax} pers.</span>
          </div>
        )}
      </div>

      {/* Content — structure identique desktop */}
      <div className="flex flex-1 flex-col p-3">
        {/* Localisation */}
        <div className="flex items-center gap-1 mb-1.5">
          <MapPin className="w-3 h-3 text-foreground-muted shrink-0" />
          <span className="text-[10px] font-semibold text-foreground-muted line-clamp-1">
            {location || 'Sénégal'}
          </span>
        </div>

        {/* Titre */}
        <h3 className="text-[13px] font-black text-foreground leading-snug line-clamp-2 mb-3 group-hover:text-primary-600 transition-colors">
          {listing.titre}
        </h3>

        {/* Prix — bloc gradient vert identique desktop */}
        <div className="mt-auto">
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
            style={{ background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%)' }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[16px] font-black text-white leading-none tracking-tight">{price}</span>
              <span className="text-[8px] font-bold text-white/70 uppercase tracking-wide">FCFA/nuit</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/35 transition-colors">
              <ArrowRight className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}