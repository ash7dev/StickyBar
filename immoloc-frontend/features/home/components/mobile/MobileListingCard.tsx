'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Camera } from 'lucide-react';
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

function formatFCFA(amount: number): string {
  return Math.round(amount * 1.07).toLocaleString('fr-FR');
}

export function MobileListingCard({ listing }: { listing: Listing }) {
  const photo    = listing.photos.find((p) => p.estPrincipale)?.url ?? listing.photos[0]?.url;
  const location = [listing.quartier, listing.ville].filter(Boolean).join(', ');
  const rating   = listing.note && listing.note > 0 ? listing.note : null;

  return (
    <Link
      href={`/logements/${listing.id}`}
      className="group flex flex-col shrink-0 snap-start rounded-2xl overflow-hidden bg-background-card border border-border shadow-sm active:scale-[0.985] transition-all duration-300"
      style={{ width: 'calc(50vw - 22px)' }}
    >
      {/* Photo - style desktop premium */}
      <div className="aspect-[4/3] relative overflow-hidden bg-background-alt">
        {photo ? (
          <Image
            src={photo}
            alt={listing.titre}
            fill
            className="object-cover"
            sizes="50vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-background-alt to-neutral-200" />
        )}

        {/* Gradient top pour badges */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

        {/* Type badge - haut gauche */}
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-background-card/90 backdrop-blur-md rounded-full text-[9px] font-black text-foreground uppercase tracking-wider shadow-md">
          {TYPE_LABELS[listing.type] ?? listing.type}
        </span>

        {/* Rating - haut droite */}
        {rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 bg-background-card/90 backdrop-blur-md rounded-full shadow-md">
            <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
            <span className="text-[9px] font-black text-foreground">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Compteur photos - comme desktop */}
        {listing.photos.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-full bg-black/50 backdrop-blur-md ring-1 ring-white/10">
            <Camera className="w-3 h-3 text-white" />
            <span className="text-[9px] font-bold text-white tabular-nums">
              {listing.photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Contenu - style desktop */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Localisation + type */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{listing.ville || 'Sénégal'}</span>
          {listing.quartier && (
            <>
              <span className="w-[2.5px] h-[2.5px] rounded-full bg-border shrink-0" />
              <span className="truncate">{listing.quartier}</span>
            </>
          )}
        </div>

        {/* Titre */}
        <h3 className="font-display text-[15px] font-semibold text-foreground leading-snug line-clamp-2 mb-2.5">
          {listing.titre}
        </h3>

        {/* Prix */}
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="font-sans text-lg font-bold text-foreground tracking-tight tabular-nums">
            {formatFCFA(listing.prixBase)}
          </span>
          <span className="text-[10px] font-semibold text-foreground-muted">
            FCFA · nuit
          </span>
        </div>
      </div>
    </Link>
  );
}
