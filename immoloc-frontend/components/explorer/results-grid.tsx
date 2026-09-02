'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, ChevronLeft, ChevronRight, Heart, ImageOff, MapPin, Moon, RotateCcw, SearchX, ShieldCheck, Star, Users, Wallet } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';
import { cn } from '@/lib/utils/cn';

import { getPrixPublic, getPrixDerniereMinute } from '@/lib/pricing';
import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';

const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const rating = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface ResultsGridProps {
  listings: Listing[];
  /** Nombre de nuits issu des filtres. Si fourni, le prix total devient l'info principale. */
  nights?: number;
}

export function ResultsGrid({ listings, nights }: ResultsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-border bg-background-card p-12 text-center shadow-xs">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-pill bg-forest-50 text-forest-700 border border-forest-100">
          <SearchX className="h-7 w-7 text-forest-600" aria-hidden="true" />
        </div>
        <h3 className="font-display text-lg sm:text-xl font-semibold text-forest-900">
          Aucun logement ne correspond à votre recherche
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground-muted">
          Essayez d’élargir vos critères ou de supprimer certains filtres.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/explorer';
            }
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-pill bg-forest-950 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-forest-900 active:scale-95 shadow-sm"
        >
          <RotateCcw className="h-4 w-4 text-on-inverse-marker" aria-hidden="true" />
          Réinitialiser la recherche
        </button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {listings.map((listing, i) => (
        <li key={listing.id}>
          <ListingRow listing={listing} nights={nights} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ListingRow({
  listing,
  nights,
  priority = false,
}: {
  listing: Listing;
  nights?: number;
  priority?: boolean;
}) {
  const router = useRouter();
  const photos = listing.photos ?? [];
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const newIdx = Math.round(scrollLeft / clientWidth);
      if (newIdx !== activePhotoIdx) setActivePhotoIdx(newIdx);
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
      const nextIdx = (activePhotoIdx + dir + photos.length) % photos.length;
      scrollRef.current.scrollTo({
        left: nextIdx * scrollRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const titre = listing.titre?.trim() || 'Logement sans titre';
  const lieu = [listing.quartier?.trim(), listing.ville?.trim()].filter(Boolean).join(', ') || 'Sénégal';

  const derniereMinuteActive = Boolean((listing as { derniereMinuteActive?: boolean }).derniereMinuteActive);
  const prix = getPrixPublic(listing.prixBase);
  const prixFinal = derniereMinuteActive ? getPrixDerniereMinute(prix) : prix;
  const hasNote = typeof listing.note === 'number' && listing.note > 0;

  const verifie = Boolean((listing as { verifie?: boolean }).verifie);
  const typeLibelle = formatType(listing.type, listing.sousType);

  return (
    <article className="group relative isolate flex flex-col overflow-hidden rounded-card border border-border bg-background-card shadow-xs transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none sm:flex-row">

      {/* ── Photo (Défilement Horizontal Natif / Scroll Snap) ─────────────────── */}
      <div className="relative z-20 aspect-[16/10] w-full shrink-0 overflow-hidden bg-neutral-100 sm:aspect-auto sm:min-h-[11rem] sm:w-[15.5rem] lg:w-[17.5rem] select-none">
        {photos.length > 0 ? (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory [overscroll-behavior-x:contain] scrollbar-hide scroll-smooth"
          >
            {photos.map((photo, i) => (
              <Link
                key={photo.url || i}
                href={`/explorer/${listing.id}`}
                tabIndex={i === activePhotoIdx ? 0 : -1}
                aria-hidden={i !== activePhotoIdx}
                className="relative h-full w-full shrink-0 snap-center block overflow-hidden"
              >
                <Image
                  src={photo.url}
                  alt={titre}
                  fill
                  priority={priority && i === 0}
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover transition-transform duration-[320ms] ease-out group-hover:scale-[1.02]"
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

        {/* Dégradé bas pour lisibilité des puces */}
        {photos.length > 1 && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-forest-950/60 to-transparent z-10"
            aria-hidden="true"
          />
        )}

        {verifie && (
          <span className="glass-dark absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[0.6875rem] font-semibold text-gold-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Vérifié
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite((v) => !v);
          }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${titre} des favoris` : `Ajouter ${titre} aux favoris`}
          className={cn(
            'absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-pill border transition-colors duration-150 active:scale-95 cursor-pointer',
            isFavorite
              ? 'border-error-500/25 bg-white text-error-500 shadow-sm'
              : 'border-white/60 bg-white/85 text-forest-700 backdrop-blur-md hover:bg-white',
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} aria-hidden="true" />
        </button>

        {photos.length > 1 && (
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
              {photos.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={scrollToPhoto(i)}
                  aria-label={`Voir photo ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200 cursor-pointer',
                    i === activePhotoIdx ? 'w-3.5 bg-white shadow-sm' : 'w-1.5 bg-white/60 hover:bg-white/90',
                  )}
                />
              ))}
              {photos.length > 5 && (
                <span className="ml-0.5 text-[0.625rem] font-bold text-white shadow-sm">+{photos.length - 5}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Contenu (Style épuré ListingCard) ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-3.5">
        <div>
          {/* Ligne 1 : Titre + Note */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-display text-base font-semibold leading-snug tracking-[-0.01em] text-forest-900">
              <Link
                href={`/explorer/${listing.id}`}
                className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
              >
                {titre}
              </Link>
            </h3>

            {hasNote && (
              <span className="flex shrink-0 items-center gap-1 text-xs sm:text-sm">
                <Star className="h-3.5 w-3.5 fill-current text-gold-500" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-foreground">{rating.format(listing.note!)}</span>
                {(listing.totalSejours ?? 0) > 0 && (
                  <span className="text-xs tabular-nums text-foreground-faint">({listing.totalSejours})</span>
                )}
              </span>
            )}
          </div>

          {/* Ligne 2 : Localisation · Sous-type */}
          <p className="mt-0.5 line-clamp-1 text-xs sm:text-sm text-foreground-muted flex items-center gap-1 flex-wrap">
            <span className="truncate">{lieu}</span>
            {typeLibelle && (
              <>
                <span className="text-foreground-faint">·</span>
                <span className="truncate text-foreground-faint">{typeLibelle}</span>
              </>
            )}
            {listing.distanceKm !== undefined && listing.distanceKm !== null && (
              <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-forest-50 px-1.5 py-0.5 text-[10px] font-extrabold text-forest-800 border border-forest-100/80 shrink-0">
                📍 À {(listing.distanceKm as number).toFixed(1)} km
              </span>
            )}
          </p>

          {/* Ligne 3 : Badges / Chips des caractéristiques */}
          <ul className="mt-2 flex flex-wrap gap-1">
            <Chip>
              <Users className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              <span>{listing.capaciteMax ?? 1} pers. max</span>
            </Chip>

            {Boolean(listing.nombreChambres && listing.nombreChambres > 0) && (
              <Chip>
                <BedDouble className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                <span>{listing.nombreChambres} chambre{listing.nombreChambres! > 1 ? 's' : ''}</span>
              </Chip>
            )}

            <Chip>
              <Moon className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              <span>
                {listing.nuitesMinimum && listing.nuitesMinimum > 1
                  ? `Min. ${listing.nuitesMinimum} nuits`
                  : '1 nuit min.'}
              </span>
            </Chip>

            <Chip>
              <Wallet className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
              <span>Acompte {(listing as any).acomptePourcentage || 30}%</span>
            </Chip>
          </ul>
        </div>

        {/* Ligne 4 : Prix bas de carte */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <TenantPriceDisplay
            prixBase={listing.prixBase}
            derniereMinuteActive={derniereMinuteActive}
            size="md"
          />
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-pill bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
      {children}
    </li>
  );
}

function formatType(type?: string | null, sousType?: string | null): string {
  if (sousType?.trim()) return sousType.trim();
  if (!type) return 'Logement';
  const labels: Record<string, string> = {
    VILLA: 'Villa',
    APPARTEMENT: 'Appartement',
    CHAMBRE: 'Chambre',
    AUTRES: 'Autre',
    AUTRE: 'Autre',
  };
  return labels[type.toUpperCase()] ?? type;
}