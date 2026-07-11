'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Heart, ArrowRight, Building2 } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { Listing } from '@/lib/nestjs/types';

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  STUDIO:      'Studio',
  VILLA:       'Villa',
  CHAMBRE:     'Chambre',
  DUPLEX:      'Duplex',
  PENTHOUSE:   'Penthouse',
};

function SpotlightSkeleton() {
  return (
    <div className="px-4">
      <div className="w-full h-[320px] bg-background-alt animate-pulse rounded-[2rem]" />
    </div>
  );
}

export function MobileSpotlight() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    listingsApi
      .search({ limit: 5 })
      .then((res) => setListings(res.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goTo = (idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ left: idx * container.clientWidth, behavior: 'smooth' });
    setActive(idx);
  };

  const resetTimer = (count: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % count;
        const container = containerRef.current;
        if (container) {
          container.scrollTo({ left: next * container.clientWidth, behavior: 'smooth' });
        }
        return next;
      });
    }, 4000);
  };

  useEffect(() => {
    if (listings.length < 2) return;
    resetTimer(listings.length);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings.length]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollLeft / container.clientWidth);
    if (idx !== active) setActive(idx);
  };

  const handleTouchStart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTouchEnd = () => {
    if (listings.length >= 2) resetTimer(listings.length);
  };

  if (loading) return <SpotlightSkeleton />;
  if (listings.length === 0) return null;

  return (
    <div className="relative px-4">
      {/* Clip wrapper — coins arrondis sans bloquer le scroll */}
      <div className="relative rounded-[2rem] overflow-hidden shadow-lg ring-1 ring-black/5">
        {/* Scroll container */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {listings.map((listing) => {
            const photo = listing.photos.find((p) => p.estPrincipale)?.url ?? listing.photos[0]?.url;
            const location = [listing.quartier, listing.ville].filter(Boolean).join(', ');
            const price = Math.round(Number(listing.prixBase) * 1.07).toLocaleString('fr-FR');
            const rating = listing.note ?? 4.8;

            return (
              <Link
                key={listing.id}
                href={`/logements/${listing.id}`}
                className="relative shrink-0 w-full h-[320px] snap-start block"
              >
                {/* Photo */}
                {photo ? (
                  <Image src={photo} alt={listing.titre} fill className="object-cover" sizes="100vw" />
                ) : (
                  <div className="absolute inset-0 bg-emerald-950 flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-white/20" />
                  </div>
                )}

                {/* Dégradés cinématographiques */}
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                {/* Top row */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-full text-[9px] font-bold text-white uppercase tracking-[0.15em]">
                    {TYPE_LABELS[listing.type] ?? listing.type}
                  </span>
                  <button
                    className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center active:scale-90 transition-transform"
                    onClick={(e) => e.preventDefault()}
                    aria-label="Ajouter aux favoris"
                  >
                    <Heart className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
                  {/* Rating */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded-full bg-black/30 backdrop-blur-md ring-1 ring-white/15">
                    <Star className="w-3 h-3 text-gold-400 fill-gold-400" />
                    <span className="text-[10px] font-bold text-white tabular-nums">{rating.toFixed(1)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl font-semibold text-white leading-tight tracking-tight line-clamp-1 mb-1 drop-shadow-sm">
                    {listing.titre}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 mb-3.5">
                    <MapPin className="w-3 h-3 text-white/60 shrink-0" />
                    <span className="text-[11px] font-medium text-white/60 truncate">{location || 'Sénégal'}</span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans text-xl font-black text-white tracking-tight tabular-nums">{price}</span>
                      <span className="text-[10px] font-semibold text-white/55">FCFA · nuit</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-background-card bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-colors">
                      Réserver
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dots — sur la photo, au-dessus du contenu */}
        {listings.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto">
            {listings.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); goTo(i); }}
                aria-label={`Aller au logement ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 18 : 5,
                  height: 5,
                  background: i === active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}