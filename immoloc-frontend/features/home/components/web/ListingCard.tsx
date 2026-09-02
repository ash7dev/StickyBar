'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bath, BedDouble, ChevronLeft, ChevronRight, Heart, ImageOff, ShieldCheck, Star, Users, Video, Zap } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';
import { VideoReelsModal } from '@/features/listings/components/web/VideoReelsModal';

import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { cn } from '@/lib/utils/cn';

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const rating = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface ListingCardProps {
  id: string;
  slug?: string;
  titre: string;
  type: string;
  sousType?: string | null;
  ville: string;
  quartier?: string | null;
  prixBase: number;
  note?: number | null;
  totalSejours?: number;
  capaciteMax?: number;
  nombreChambres?: number | null;
  nombreSallesBain?: number | null;
  nuitesMinimum?: number | null;
  acomptePourcentage?: number;
  verifie?: boolean;
  sponsorise?: boolean;
  isInstantBooking?: boolean;
  photos?: { url: string; categorie?: string }[];
  priority?: boolean;
  variant?: 'light' | 'dark' | 'standard' | 'premium';
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
}

export function ListingCard({
  id,
  titre,
  type,
  sousType,
  ville,
  quartier,
  prixBase,
  note,
  totalSejours = 0,
  capaciteMax,
  nombreChambres,
  nombreSallesBain,
  nuitesMinimum = 1,
  acomptePourcentage = 30,
  verifie = false,
  sponsorise = false,
  isInstantBooking = false,
  photos = [],
  priority = false,
  variant = 'light',
  derniereMinuteActive = false,
  videoUrl = null,
}: ListingCardProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const photoList = photos || [];
  const lieu = quartier ? `${quartier}, ${ville}` : ville;
  const categorie = sousType ?? type;
  const isDark = variant === 'dark';

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      if (idx !== photoIdx) setPhotoIdx(idx);
    }
  };

  const scrollToPhoto = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const movePhoto = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      const nextIdx = (photoIdx + dir + photoList.length) % photoList.length;
      scrollRef.current.scrollTo({
        left: nextIdx * scrollRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  // Objet partiel compatible avec la modale VideoReelsModal
  const listingData: Partial<Listing> & { id: string; titre: string; ville: string; prixBase: number; videoUrl?: string | null; isInstantBooking?: boolean } = {
    id,
    titre,
    ville,
    prixBase,
    videoUrl,
    isInstantBooking,
  };

  return (
    <>
      <article
        className={`group relative isolate flex flex-col overflow-hidden rounded-card transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none ${
          isDark
            ? 'border border-white/15 bg-forest-900/60 backdrop-blur-md hover:border-lime-400/40 hover:bg-forest-900/80 shadow-xl'
            : 'border border-border bg-background-card hover:shadow-md'
        }`}
      >

        {/* ── Photo (Défilement Horizontal Natif / Scroll Snap) ─────────────────── */}
        <div className="relative z-20 aspect-[4/3] overflow-hidden bg-neutral-100 select-none">
          {photoList.length > 0 ? (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex h-full w-full overflow-x-auto snap-x snap-mandatory [overscroll-behavior-x:contain] scrollbar-hide scroll-smooth"
            >
              {photoList.map((photo, i) => (
                <Link
                  key={photo.url || i}
                  href={`/explorer/${id}`}
                  tabIndex={i === photoIdx ? 0 : -1}
                  aria-hidden={i !== photoIdx}
                  className="relative h-full w-full shrink-0 snap-center block overflow-hidden"
                >
                  <Image
                    src={photo.url}
                    alt={titre}
                    fill
                    priority={priority && i === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid h-full place-items-center text-neutral-300">
              <ImageOff className="h-7 w-7" aria-hidden="true" />
              <span className="sr-only">Photo non disponible</span>
            </div>
          )}

          {/* Dégradé bas pour puces */}
          {photoList.length > 1 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-forest-950/60 to-transparent z-10"
              aria-hidden="true"
            />
          )}

          {/* Badges sur la photo */}
          <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5 items-start">
            {isInstantBooking && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-action px-2.5 py-0.5 text-[0.6875rem] font-extrabold text-on-action shadow-sm">
                <Zap className="h-3 w-3 fill-forest-950" aria-hidden="true" />
                Instantané
              </span>
            )}
            {verifie && (
              <span className="glass-dark inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold text-neutral-50">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Vérifié
              </span>
            )}
            {videoUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideoModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-pill bg-black/70 px-2.5 py-1 text-[0.6875rem] font-bold text-white backdrop-blur-md hover:bg-black/90 transition-colors z-30 shadow-md cursor-pointer"
              >
                <Video className="h-3.5 w-3.5 text-on-inverse-marker" aria-hidden="true" />
                Visite 360°
              </button>
            )}
          </div>

          <div className="absolute right-3 top-3 z-20">
            <FavoriteButton listingId={id} size="md" />
          </div>

          {photoList.length > 1 && (
            <>
              {/* Flèches de navigation */}
              <button
                type="button"
                onClick={movePhoto(-1)}
                aria-label="Photo précédente"
                className="absolute left-2 top-1/2 z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-forest-900 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-90 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={movePhoto(1)}
                aria-label="Photo suivante"
                className="absolute right-2 top-1/2 z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-forest-900 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-90 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>

              {/* Puces interactives en bas de la photo */}
              <div className="absolute inset-x-0 bottom-2.5 z-20 flex items-center justify-center gap-1.5" aria-hidden="true">
                {photoList.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={scrollToPhoto(i)}
                    aria-label={`Voir photo ${i + 1}`}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                      i === photoIdx ? 'w-3.5 bg-white shadow-sm' : 'w-1.5 bg-white/60 hover:bg-white/90',
                    )}
                  />
                ))}
                {photoList.length > 5 && (
                  <span className="ml-0.5 text-[0.625rem] font-bold text-white shadow-sm">+{photoList.length - 5}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Contenu ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`min-w-0 font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] ${
              isDark ? 'text-neutral-0 group-hover:text-lime-300 transition-colors' : 'text-forest-900'
            }`}>
              <Link
                href={`/explorer/${id}`}
                className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
              >
                {titre}
              </Link>
            </h3>

            {typeof note === 'number' && note > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-current text-gold-400" aria-hidden="true" />
                <span className={`font-semibold tabular-nums ${isDark ? 'text-neutral-50' : 'text-foreground'}`}>
                  {rating.format(note)}
                </span>
                {totalSejours > 0 && (
                  <span className={`text-xs tabular-nums ${isDark ? 'text-forest-200' : 'text-foreground-faint'}`}>
                    ({totalSejours})
                  </span>
                )}
              </span>
            )}
          </div>

          <p className={`mt-1 line-clamp-1 text-sm ${isDark ? 'text-forest-200' : 'text-foreground-muted'}`}>
            {lieu}
            {categorie && <span className={isDark ? 'text-forest-300/60' : 'text-foreground-faint'}> · {categorie}</span>}
          </p>

          {/* Specs Airbnb-style */}
          {(capaciteMax || nombreChambres || nombreSallesBain || nuitesMinimum) && (
            <p className={`mt-1.5 text-xs font-medium ${isDark ? 'text-forest-200/80' : 'text-foreground-faint'}`}>
              {[
                capaciteMax && capaciteMax > 0 ? `${capaciteMax} voy. max` : null,
                nombreChambres ? `${nombreChambres} ch.` : null,
                nombreSallesBain ? `${nombreSallesBain} sdb` : null,
                nuitesMinimum && nuitesMinimum > 1 ? `Min. ${nuitesMinimum} nuits` : '1 nuit min.',
              ].filter(Boolean).join(' · ')}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <TenantPriceDisplay
              prixBase={prixBase}
              derniereMinuteActive={derniereMinuteActive}
              size="md"
              isInverse={isDark}
            />

            {sponsorise && !derniereMinuteActive ? (
              <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[0.6875rem] font-medium ${
                isDark ? 'bg-white/10 text-neutral-100 border border-white/10' : 'bg-neutral-100 text-foreground-faint'
              }`}>
                Mis en avant
              </span>
            ) : null}
          </div>
        </div>
      </article>

      {/* Modale Vidéo Reels */}
      {videoUrl && (
        <VideoReelsModal
          listing={listingData as Listing}
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
      <div className="p-4">
        <div className="h-[1.0625rem] w-3/4 animate-pulse rounded bg-neutral-100" />
        <div className="mt-2.5 h-3.5 w-1/2 animate-pulse rounded bg-neutral-100" />
        <div className="mt-5 h-[1.125rem] w-2/5 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}