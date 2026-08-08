'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs';
import type { Listing } from '@/lib/nestjs';
import { ListingCard } from '@/features/home/components/web/ListingCard';
import { cn } from '@/lib/utils/cn';

interface SimilarListingsSectionProps {
  currentListing: Listing;
  className?: string;
}

export function SimilarListingsSection({ currentListing, className }: SimilarListingsSectionProps) {
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSimilar() {
      setLoading(true);
      try {
        // Lancer les recherches ville et type en parallèle (divise le temps de chargement par 2)
        const [resCity, resType] = await Promise.all([
          listingsApi.search({ ville: currentListing.ville, limit: 10 }),
          listingsApi.search({ type: currentListing.type, limit: 8 }),
        ]);

        const cityItems = (resCity.data ?? []).filter((l) => l.id !== currentListing.id);
        const typeItems = (resType.data ?? []).filter(
          (l) => l.id !== currentListing.id && !cityItems.some((existing) => existing.id === l.id),
        );

        const items = cityItems.length >= 4 ? cityItems : [...cityItems, ...typeItems];

        if (isMounted) {
          setSimilarListings(items as unknown as Listing[]);
        }
      } catch (err) {
        console.error('Erreur chargement logements similaires:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (currentListing?.id) {
      loadSimilar();
    }

    return () => {
      isMounted = false;
    };
  }, [currentListing.id, currentListing.ville, currentListing.type]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [similarListings, loading]);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!loading && similarListings.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-6 pt-2 pb-6 w-full', className)}>
      {/* ── En-tête avec titre et flèches de navigation ──────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-inner bg-forest-50 text-forest-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
              Logements similaires &amp; à proximité
            </h2>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            Découvrez d&apos;autres hébergements vérifiés à <span className="font-semibold text-foreground">{currentListing.ville}</span> ou du même style.
          </p>
        </div>

        {/* Boutons défilement horizontal (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-350)}
            disabled={!canScrollLeft}
            aria-label="Défiler vers la gauche"
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-background-card text-foreground transition-all hover:bg-background-alt disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(350)}
            disabled={!canScrollRight}
            aria-label="Défiler vers la droite"
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-background-card text-foreground transition-all hover:bg-background-alt disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Carousel défilement horizontal sans scrollbar et sans masque blanc ───── */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-visible snap-x snap-mandatory gap-4 sm:gap-6 py-4 px-4 sm:px-6 lg:px-8 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[280px] sm:w-[320px] shrink-0 snap-start rounded-[2rem] border border-border bg-background-alt overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-border" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-border rounded-full w-1/3" />
                    <div className="h-4 bg-border rounded-full w-3/4" />
                    <div className="h-3 bg-border rounded-full w-1/2" />
                  </div>
                </div>
              ))
            : similarListings.map((item) => (
                <div
                  key={item.id}
                  className="w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <ListingCard
                    id={item.id}
                    titre={item.titre}
                    type={item.type}
                    sousType={item.sousType ?? undefined}
                    ville={item.ville}
                    quartier={item.quartier ?? undefined}
                    prixBase={Number(item.prixBase)}
                    note={item.note ? Number(item.note) : null}
                    totalSejours={item.totalSejours ?? 0}
                    photos={item.photos ?? []}
                    isInstantBooking={item.isInstantBooking}
                    derniereMinuteActive={item.derniereMinuteActive}
                    videoUrl={item.videoUrl}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
