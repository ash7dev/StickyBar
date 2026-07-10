'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X, ChevronLeft, ChevronRight, ZoomIn,
  ShieldCheck, LogOut, Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Photo {
  id: string;
  url: string;
  categorie: string;
}

interface Props {
  photos: Photo[];
  onClose: () => void;
}

/* ─── Config catégories ───────────────────────────────────────────────────── */

const CATEGORIE_CFG: Record<string, { label: string; icon: React.ReactNode }> = {
  ENTREE:       { label: 'Entrée',        icon: <DoorIcon />      },
  SALON:        { label: 'Salon',         icon: <SofaIcon />      },
  CHAMBRE:      { label: 'Chambre',       icon: <BedIcon />       },
  CUISINE:      { label: 'Cuisine',       icon: <CookingIcon />   },
  SALLE_DE_BAIN:{ label: 'Salle de bain', icon: <BathIcon />      },
  TERRASSE:     { label: 'Terrasse',      icon: <SunIcon />       },
  PISCINE:      { label: 'Piscine',       icon: <WavesIcon />     },
  VUE:          { label: 'Vue',           icon: <MountainIcon />  },
  AUTRE:        { label: 'Autre',         icon: <Camera className="w-3.5 h-3.5" /> },
};

function getCfg(categorie: string) {
  return CATEGORIE_CFG[categorie] ?? { label: categorie, icon: <Camera className="w-3.5 h-3.5" /> };
}

/* ─── SVG icons pièces ────────────────────────────────────────────────────── */

function DoorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4H6a1 1 0 0 0-1 1v15h14V5a1 1 0 0 0-1-1h-1" />
      <path d="M13 4v16" />
      <circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SofaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
      <path d="M2 11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2v-4Z" />
      <path d="M4 15v2" /><path d="M20 15v2" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" /><path d="M6 8v9" />
      <rect x="6" y="5" width="7" height="3" rx="1" />
    </svg>
  );
}

function CookingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h18" /><path d="M3 5h18" />
      <path d="M3 5v13" /><path d="M21 5v13" />
      <circle cx="9" cy="11" r="1.5" /><circle cx="15" cy="11" r="1.5" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <line x1="3" y1="13" x2="21" y2="13" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function WavesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

/* ─── Lightbox ────────────────────────────────────────────────────────────── */

function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const photo = photos[current];

  const prev = useCallback(() => setCurrent((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onClose]);

  const cfg = getCfg(photo.categorie);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
        onClick={onClose}
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Compteur + catégorie */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white backdrop-blur-sm">
          <span className="text-neutral-400">{cfg.icon}</span>
          {cfg.label}
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-neutral-400 backdrop-blur-sm tabular-nums">
          {current + 1} / {photos.length}
        </span>
      </div>

      {/* Photo centrale */}
      <div
        className="relative w-full max-w-3xl max-h-[80dvh] aspect-auto mx-16 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.url}
          alt={cfg.label}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>

      {/* Navigation */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Bande thumbnails bas */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 px-4 py-2.5 bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 max-w-[90vw] overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={cn(
                'relative shrink-0 w-10 h-10 rounded-xl overflow-hidden border-2 transition-all duration-150',
                i === current ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-80',
              )}
            >
              <Image src={p.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Galerie principale ──────────────────────────────────────────────────── */

export function CheckoutGalleryModal({ photos, onClose }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /* Grouper par catégorie */
  const grouped = photos.reduce<Record<string, Photo[]>>((acc, p) => {
    (acc[p.categorie] ??= []).push(p);
    return acc;
  }, {});

  /* Index global d'une photo (pour le lightbox) */
  const globalIndex = (cat: string, localIdx: number) => {
    let offset = 0;
    for (const [key, ps] of Object.entries(grouped)) {
      if (key === cat) return offset + localIdx;
      offset += ps.length;
    }
    return localIdx;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && lightboxIndex === null) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, lightboxIndex]);

  return (
    <>
      {/* Fond */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Carte principale */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-2xl bg-surface-dark border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/60 flex flex-col max-h-[92dvh] overflow-hidden"
        >

          {/* ── En-tête ── */}
          <div className="shrink-0 px-6 pt-6 pb-5 border-b border-white/8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white leading-tight">
                    État des lieux de sortie
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {photos.length} photo{photos.length > 1 ? 's' : ''} · Uploadées par l&apos;hôte
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/14 border border-white/8 flex items-center justify-center transition-colors shrink-0 mt-0.5"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {/* Bandeau informatif */}
            <div className="mt-4 flex items-start gap-3 bg-amber-500/10 border border-amber-400/20 rounded-2xl px-4 py-3.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-200 leading-snug">
                  État des lieux de sortie
                </p>
                <p className="text-[11px] text-amber-400/80 mt-0.5 leading-relaxed">
                  Ces photos documentent l&apos;état du logement à votre départ. En cas de
                  désaccord, vous disposez de 48h pour déclarer un litige.
                </p>
              </div>
            </div>
          </div>

          {/* ── Corps scrollable ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {Object.entries(grouped).map(([categorie, catPhotos]) => {
              const cfg = getCfg(categorie);
              return (
                <div key={categorie}>
                  {/* Titre section */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/8 border border-white/8 text-neutral-400">
                      {cfg.icon}
                    </span>
                    <span className="text-xs font-bold text-neutral-300">{cfg.label}</span>
                    <span className="text-[10px] font-bold text-neutral-600 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                      {catPhotos.length}
                    </span>
                  </div>

                  {/* Grille photos */}
                  <div className={cn(
                    'grid gap-2',
                    catPhotos.length === 1 ? 'grid-cols-1' :
                    catPhotos.length === 2 ? 'grid-cols-2' :
                    'grid-cols-3',
                  )}>
                    {catPhotos.map((photo, localIdx) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setLightboxIndex(globalIndex(categorie, localIdx))}
                        className={cn(
                          'group relative overflow-hidden rounded-2xl bg-white/5 border border-white/8',
                          'hover:border-white/20 hover:shadow-lg hover:shadow-black/40 transition-all duration-200',
                          catPhotos.length === 1 ? 'aspect-video' : 'aspect-square',
                        )}
                      >
                        <Image
                          src={photo.url}
                          alt={cfg.label}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
                        />
                        {/* Overlay hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pied de page ── */}
          <div className="shrink-0 px-6 pb-6 pt-4 border-t border-white/8">
            <div className="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-2xl px-4 py-3">
              <Camera className="w-4 h-4 text-neutral-500 shrink-0" />
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Appuyez sur une photo pour l&apos;agrandir · Naviguez avec les flèches ← →
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
