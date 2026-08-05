'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ImageOff, ShieldCheck, Star, Video, Zap } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';
import { VideoReelsModal } from '@/features/listings/components/web/VideoReelsModal';

import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';

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
  sousType?: string;
  ville: string;
  quartier?: string;
  prixBase: number;
  note: number | null;
  totalSejours: number;
  photos: { url: string }[];
  verifie?: boolean;
  sponsorise?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, next: boolean) => void;
  priority?: boolean;
  variant?: 'standard' | 'premium';
  isInstantBooking?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
}

export function ListingCard({
  id,
  slug,
  titre,
  type,
  sousType,
  ville,
  quartier,
  prixBase,
  note,
  totalSejours,
  photos,
  verifie = false,
  sponsorise = false,
  isFavorite = false,
  onToggleFavorite,
  priority = false,
  isInstantBooking = false,
  derniereMinuteActive = false,
  videoUrl = null,
}: ListingCardProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const src = photos?.[0]?.url;
  const lieu = quartier ? `${quartier}, ${ville}` : ville;
  const categorie = sousType ?? type;

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
      <article className="group relative isolate flex flex-col overflow-hidden rounded-card border border-border bg-background-card transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">

        {/* ── Photo ───────────────────────────────────────────────────────── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <div className="grid h-full place-items-center text-neutral-300">
              <ImageOff className="h-7 w-7" aria-hidden="true" />
              <span className="sr-only">Photo non disponible</span>
            </div>
          )}

          {/* Badges sur la photo */}
          <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5 items-start">
            {isInstantBooking && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-lime-400 px-2.5 py-0.5 text-[0.6875rem] font-extrabold text-forest-950 shadow-sm">
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
                className="inline-flex items-center gap-1.5 rounded-pill bg-black/70 px-2.5 py-1 text-[0.6875rem] font-bold text-white backdrop-blur-md hover:bg-black/90 transition-colors z-30 shadow-md"
              >
                <Video className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
                Visite 360°
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite?.(id, !isFavorite)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Retirer ${titre} des favoris` : `Ajouter ${titre} aux favoris`}
            className={`absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-pill border transition-colors duration-150 ${
              isFavorite
                ? 'border-error-500/25 bg-white text-error-500'
                : 'border-white/60 bg-white/80 text-forest-700 backdrop-blur-md hover:bg-white'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        </div>

        {/* ── Contenu ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 font-display text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-forest-900">
              <Link
                href={`/explorer/${slug ?? id}`}
                className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
              >
                {titre}
              </Link>
            </h3>

            {note !== null && note > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-current text-gold-500" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-foreground">
                  {rating.format(note)}
                </span>
                {totalSejours > 0 && (
                  <span className="text-xs text-foreground-faint tabular-nums">
                    ({totalSejours})
                  </span>
                )}
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-1 text-sm text-foreground-muted">
            {lieu}
            {categorie && <span className="text-foreground-faint"> · {categorie}</span>}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <TenantPriceDisplay
              prixBase={prixBase}
              derniereMinuteActive={derniereMinuteActive}
              size="md"
            />

            {derniereMinuteActive ? (
              <span className="shrink-0 rounded-pill bg-amber-400 text-slate-950 px-2 py-0.5 text-[0.6875rem] font-black uppercase tracking-wider shadow-xs">
                ⚡ -15%
              </span>
            ) : sponsorise ? (
              <span className="shrink-0 rounded-pill bg-neutral-100 px-2 py-0.5 text-[0.6875rem] font-medium text-foreground-faint">
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