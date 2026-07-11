import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Users, ArrowRight, Images } from 'lucide-react';
import type { Listing } from '@/lib/nestjs';

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  STUDIO:      'Studio',
  VILLA:       'Villa',
  CHAMBRE:     'Chambre',
  DUPLEX:      'Duplex',
  PENTHOUSE:   'Penthouse',
  AUTRES:      'Autre',
};

interface Props {
  listing: Listing;
}

export function PublicPropertyCard({ listing }: Props) {
  const mainPhoto = listing.photos.find((p) => p.estPrincipale) ?? listing.photos[0];
  const location = [listing.quartier, listing.ville].filter(Boolean).join(', ');
  const price = Math.round(Number(listing.prixBase) * 1.07).toLocaleString('fr-FR');
  const rating = listing.note && listing.note > 0 ? listing.note : null;

  return (
    <Link
      href={`/logements/${listing.id}`}
      className="group flex flex-col rounded-[2rem] overflow-hidden bg-background-card shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-border hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)] hover:-translate-y-1 transition-all duration-300 h-full"
    >
      {/* Image - ratio amélioré */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-background-alt to-border shrink-0">
        {mainPhoto ? (
          <Image
            src={mainPhoto.url}
            alt={listing.titre}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-border to-border-hover" />
        )}

        {/* Overlay gradient pour meilleure lisibilité des badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-overlay-light via-transparent to-overlay-light/30" />

        {/* Type badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3.5 py-1.5 bg-background-card/95 backdrop-blur-sm rounded-full text-[11px] font-black text-foreground uppercase tracking-wider shadow-lg">
            {TYPE_LABELS[listing.type] ?? listing.type}
          </span>
        </div>

        {/* Rating */}
        {rating && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-background-card/95 backdrop-blur-sm rounded-full shadow-lg">
            <Star className="w-3.5 h-3.5 text-warning-500 fill-warning-500" />
            <span className="text-[11px] font-black text-foreground">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Photo count */}
        {listing.photos.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-overlay backdrop-blur-md rounded-full">
            <Images className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white">{listing.photos.length}</span>
          </div>
        )}

        {/* Capacité badge */}
        {listing.capaciteMax > 0 && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-overlay backdrop-blur-md rounded-full">
            <Users className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white">{listing.capaciteMax} pers.</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Localisation */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <MapPin className="w-4 h-4 text-foreground-muted shrink-0" />
          <span className="text-[13px] font-semibold text-foreground-muted line-clamp-1">
            {location || 'Sénégal'}
          </span>
        </div>

        {/* Titre */}
        <h3 className="text-[17px] font-black text-foreground leading-[1.4] line-clamp-2 mb-4 group-hover:text-emerald-600 transition-colors">
          {listing.titre}
        </h3>

        {/* Prix - design amélioré */}
        <div className="mt-auto">
          <div
            className="flex items-center justify-between px-4 py-3.5 rounded-[1.4rem] shadow-sm group-hover:shadow-md transition-shadow"
            style={{ background: 'linear-gradient(135deg, var(--emerald-600) 0%, var(--emerald-500) 100%)' }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[22px] font-black text-white leading-none tracking-tight">{price}</span>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide">FCFA/nuit</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/35 transition-colors">
              <ArrowRight className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
