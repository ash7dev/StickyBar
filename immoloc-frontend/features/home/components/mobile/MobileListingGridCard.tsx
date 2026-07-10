'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Camera, ImageOff } from 'lucide-react';
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
  const photo = listing.photos.find((p) => p.estPrincipale)?.url ?? listing.photos[0]?.url;
  const location = [listing.quartier, listing.ville].filter(Boolean).join(', ');
  // TODO: le prix affiché (commission incluse) devrait venir de l'API,
  // pas d'un ×1.07 côté client — un seul endroit de vérité pour le taux.
  const price = Math.round(Number(listing.prixBase) * 1.07).toLocaleString('fr-FR');
  const rating = listing.note && listing.note > 0 ? Number(listing.note) : null;

  return (
    <Link
      href={`/logements/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background-card shadow-sm hover:shadow-xl hover:border-border-hover hover:-translate-y-0.5 transition-all duration-500"
    >
      {/* Photo - style desktop premium avec hover */}
      <div className="relative w-full shrink-0 aspect-[4/5] bg-background-alt overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={listing.titre}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-out"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <ImageOff className="w-8 h-8 text-neutral-300" />
            <span className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider">
              Aucune photo
            </span>
          </div>
        )}

        {/* Gradient top pour badges - style desktop */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

        {/* Type badge - style desktop */}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-background-card/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-foreground shadow-md">
          {TYPE_LABELS[listing.type] ?? listing.type}
        </span>

        {/* Note - style desktop */}
        {rating && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-background-card/90 backdrop-blur-md px-2 py-1 shadow-md">
            <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
            <span className="text-[9px] font-black text-foreground">
              {rating.toFixed(1)}
            </span>
          </span>
        )}

        {/* Compteur photos - style desktop */}
        {listing.photos.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-full bg-black/45 backdrop-blur-md ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Camera className="w-3 h-3 text-white" />
            <span className="text-[9px] font-bold text-white tabular-nums">
              {listing.photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Contenu - style desktop premium */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Localisation - style desktop */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted uppercase tracking-[0.12em] mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{listing.ville || 'Sénégal'}</span>
          {listing.quartier && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-border shrink-0" />
              <span className="truncate">{listing.quartier}</span>
            </>
          )}
        </div>

        {/* Titre - style desktop avec hover effet */}
        <h3 className="font-display text-[15px] font-semibold text-foreground leading-snug line-clamp-2 mb-2.5 group-hover:text-primary-600 transition-colors duration-300">
          {listing.titre}
        </h3>

        {/* Prix - style desktop */}
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="font-sans text-lg font-bold text-foreground tracking-tight tabular-nums">
            {price}
          </span>
          <span className="text-[10px] font-semibold text-foreground-muted">
            FCFA · nuit
          </span>
        </div>
      </div>
    </Link>
  );
}