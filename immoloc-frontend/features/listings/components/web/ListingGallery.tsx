'use client';

import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Grid2x2, ZoomIn } from 'lucide-react';
import type { ListingPhoto } from '@/lib/nestjs';

interface Props {
  photos: ListingPhoto[];
  title: string;
}

export function ListingGallery({ photos, title }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [lightboxRef, lightboxApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const lightboxPrev = useCallback(() => lightboxApi?.scrollPrev(), [lightboxApi]);
  const lightboxNext = useCallback(() => lightboxApi?.scrollNext(), [lightboxApi]);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setTimeout(() => lightboxApi?.scrollTo(index, true), 50);
  }

  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-[2rem] bg-background-alt flex items-center justify-center">
        <p className="text-sm font-medium text-foreground-muted">Aucune photo disponible</p>
      </div>
    );
  }

  const mainPhoto = photos.find((p) => p.estPrincipale) ?? photos[0];
  const otherPhotos = photos.filter((p) => p.id !== mainPhoto.id).slice(0, 4);

  return (
    <>
      {/* ── Grille Desktop ─────────────────────────────────────────────────── */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 rounded-[2rem] overflow-hidden h-[480px]">
        {/* Photo principale */}
        <div
          className="col-span-2 row-span-2 relative cursor-zoom-in group"
          onClick={() => openLightbox(photos.indexOf(mainPhoto))}
        >
          <Image src={mainPhoto.url} alt={title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-transparent group-hover:bg-overlay-light transition-colors duration-300" />
          <div className="absolute bottom-3 left-3 p-2 bg-overlay backdrop-blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Photos secondaires */}
        {Array.from({ length: 4 }).map((_, i) => {
          const photo = otherPhotos[i];
          const isLast = i === 3 && photos.length > 5;
          return (
            <div
              key={i}
              className="relative cursor-zoom-in group overflow-hidden"
              onClick={() => photo && openLightbox(photos.indexOf(photo))}
            >
              {photo ? (
                <>
                  <Image src={photo.url} alt={`${title} ${i + 2}`} fill sizes="25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  {isLast && (
                    <div className="absolute inset-0 bg-overlay flex items-center justify-center" onClick={() => openLightbox(0)}>
                      <div className="text-center">
                        <Grid2x2 className="w-5 h-5 text-white mx-auto mb-1" />
                        <span className="text-sm font-black text-white">+{photos.length - 5}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-background-alt" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bouton "Toutes les photos" */}
      <div className="hidden md:flex justify-end mt-3">
        <button
          onClick={() => openLightbox(0)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-bold text-foreground-muted hover:border-primary-400 hover:text-primary-600 transition-all"
        >
          <Grid2x2 className="w-4 h-4" />
          Voir les {photos.length} photos
        </button>
      </div>

      {/* ── Carousel Mobile ────────────────────────────────────────────────── */}
      <div className="md:hidden relative rounded-[1.5rem] overflow-hidden aspect-[4/3]">
        <div ref={emblaRef} className="overflow-hidden h-full">
          <div className="flex h-full">
            {photos.map((photo, i) => (
              <div key={photo.id} className="flex-[0_0_100%] relative h-full" onClick={() => openLightbox(i)}>
                <Image src={photo.url} alt={`${title} ${i + 1}`} fill sizes="100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <button onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-overlay backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-overlay backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-overlay backdrop-blur-xl rounded-full text-[10px] font-bold text-white/80 border border-white/10">
          {photos.length} photos
        </div>
      </div>

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          {/* Fermer */}
          <button
            className="absolute top-5 right-5 z-10 w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full text-xs font-bold text-white/80">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Carousel */}
          <div className="w-full max-w-5xl px-16" onClick={(e) => e.stopPropagation()}>
            <div ref={lightboxRef} className="overflow-hidden">
              <div className="flex">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="flex-[0_0_100%] relative aspect-[16/9]">
                    <Image src={photo.url} alt={`${title} ${i + 1}`} fill sizes="(max-width: 1280px) 100vw, 1024px" className="object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={(e) => { e.stopPropagation(); lightboxPrev(); setLightboxIndex((p) => Math.max(0, p - 1)); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); lightboxNext(); setLightboxIndex((p) => Math.min(photos.length - 1, p + 1)); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Thumbnails */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4 overflow-x-auto max-w-lg">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={(e) => { e.stopPropagation(); lightboxApi?.scrollTo(i, true); setLightboxIndex(i); }}
                className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIndex ? 'border-primary-400' : 'border-transparent opacity-50 hover:opacity-80'}`}
              >
                <Image src={photo.url} alt="" width={56} height={40} className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
