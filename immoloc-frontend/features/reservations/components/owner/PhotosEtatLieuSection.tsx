'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Camera, X, ChevronLeft, ChevronRight,
  LogIn, LogOut, User, Home, ZoomIn,
  CheckCircle2, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TypeEtatLieu, RoleUpload } from '@/lib/nestjs/types';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Photo {
  id: string;
  type: TypeEtatLieu;
  uploadePar: RoleUpload;
  url: string;
  categorie: string;
  creeLe: string;
}

interface Props {
  checkinPhotos: Photo[];
  checkoutPhotos: Photo[];
}

/* ─── Config (Klef Design System v2) ──────────────────────────────────── */

const CATEGORIE_LABEL: Record<string, string> = {
  SALON: 'Salon', CHAMBRE: 'Chambre', CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle de bain', TERRASSE: 'Terrasse',
  VUE: 'Vue', ENTREE: 'Entrée', PISCINE: 'Piscine', AUTRE: 'Autre',
};

const UPLOADER_CFG: Record<string, { label: string; icon: typeof User; accent: string }> = {
  PROPRIO:   { label: 'Propriétaire', icon: Home, accent: 'text-forest-800 bg-forest-50 border-forest-100' },
  LOCATAIRE: { label: 'Locataire',    icon: User, accent: 'text-amber-800 bg-amber-50 border-amber-200' },
};

function dateTimeFull(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Lightbox ────────────────────────────────────────────────────────────── */

function Lightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const photo = photos[idx];
  const uploaderCfg = UPLOADER_CFG[photo.uploadePar] ?? UPLOADER_CFG.PROPRIO;
  const UploaderIcon = uploaderCfg.icon;

  const goNext = useCallback(() => setIdx((i) => (i + 1) % photos.length), [photos.length]);
  const goPrev = useCallback(() => setIdx((i) => (i - 1 + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-inner bg-forest-900 hover:bg-forest-800 border border-forest-800 flex items-center justify-center transition-all duration-200 backdrop-blur-sm text-forest-200"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-20 px-4 py-2 rounded-pill bg-forest-900 border border-forest-800 backdrop-blur-sm">
        <span className="text-sm font-bold text-white tabular-nums">
          {idx + 1} <span className="text-forest-300">/ {photos.length}</span>
        </span>
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 md:left-6 z-20 w-11 h-11 rounded-inner bg-forest-900 hover:bg-forest-800 border border-forest-800 flex items-center justify-center transition-all duration-200 backdrop-blur-sm text-white"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 md:right-6 z-20 w-11 h-11 rounded-inner bg-forest-900 hover:bg-forest-800 border border-forest-800 flex items-center justify-center transition-all duration-200 backdrop-blur-sm text-white"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Main image */}
      <div className="relative z-10 w-full max-w-4xl max-h-[80vh] mx-4 md:mx-8 aspect-auto">
        <div className="relative w-full h-[70vh] rounded-card overflow-hidden bg-forest-950 border border-forest-800">
          <Image
            key={photo.id}
            src={photo.url}
            alt={photo.categorie}
            fill
            className="object-contain animate-in fade-in duration-300"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />
        </div>

        {/* Photo info bar */}
        <div className="flex items-center justify-between gap-4 mt-4 px-1">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-inner bg-forest-900 border border-forest-800 text-xs font-bold text-white backdrop-blur-sm">
              <Camera className="w-3.5 h-3.5 text-lime-400" />
              {CATEGORIE_LABEL[photo.categorie] ?? photo.categorie}
            </span>
            {/* Uploader */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-inner bg-forest-900 border border-forest-800 text-xs font-bold text-white backdrop-blur-sm">
              <UploaderIcon className="w-3.5 h-3.5 text-lime-400" />
              {uploaderCfg.label}
            </span>
          </div>
          {/* Date */}
          <span className="text-xs font-bold text-forest-300 shrink-0">
            {dateTimeFull(photo.creeLe)}
          </span>
        </div>
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-3 rounded-card bg-forest-950/90 border border-forest-800 backdrop-blur-xl max-w-[90vw] overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIdx(i)}
              className={cn(
                'relative shrink-0 w-12 h-12 rounded-inner overflow-hidden border-2 transition-all duration-200',
                i === idx
                  ? 'border-lime-400 shadow-md scale-110'
                  : 'border-transparent opacity-50 hover:opacity-80',
              )}
            >
              <Image src={p.url} alt="" fill className="object-cover" sizes="48px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Photo Grid Item ─────────────────────────────────────────────────────── */

function PhotoGridItem({
  photo,
  isLarge,
  onClick,
}: {
  photo: Photo;
  isLarge?: boolean;
  onClick: () => void;
}) {
  const uploaderCfg = UPLOADER_CFG[photo.uploadePar] ?? UPLOADER_CFG.PROPRIO;
  const UploaderIcon = uploaderCfg.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative rounded-inner overflow-hidden bg-background-alt border border-border/80',
        'transition-all duration-300 hover:shadow-md hover:border-forest-300',
        'focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2',
        isLarge ? 'col-span-2 row-span-2' : '',
      )}
    >
      <div className={cn('relative w-full', isLarge ? 'aspect-[4/3]' : 'aspect-square')}>
        <Image
          src={photo.url}
          alt={CATEGORIE_LABEL[photo.categorie] ?? photo.categorie}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={isLarge ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

        {/* Zoom icon (hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-10 h-10 rounded-pill bg-forest-950/80 backdrop-blur-sm border border-lime-400/30 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <ZoomIn className="w-4 h-4 text-lime-400" />
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-forest-950/85 backdrop-blur-sm border border-forest-800 text-[10px] font-bold text-white shadow-sm">
            {CATEGORIE_LABEL[photo.categorie] ?? photo.categorie}
          </span>
        </div>

        {/* Uploader badge (hover) */}
        <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-pill border text-[10px] font-bold backdrop-blur-sm shadow-sm',
            uploaderCfg.accent,
          )}>
            <UploaderIcon className="w-2.5 h-2.5" />
            {uploaderCfg.label}
          </span>
        </div>

        {/* Date (hover) */}
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-forest-950/80 backdrop-blur-sm border border-forest-800 text-[9px] font-bold text-forest-200">
            <Clock className="w-2.5 h-2.5 text-lime-400" />
            {dateTimeFull(photo.creeLe)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── Main Section ────────────────────────────────────────────────────────── */

export function PhotosEtatLieuSection({ checkinPhotos, checkoutPhotos }: Props) {
  const [activeTab, setActiveTab] = useState<'CHECKIN' | 'CHECKOUT'>(
    checkinPhotos.length > 0 ? 'CHECKIN' : 'CHECKOUT',
  );
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; index: number } | null>(null);

  const hasCheckin = checkinPhotos.length > 0;
  const hasCheckout = checkoutPhotos.length > 0;
  const hasBoth = hasCheckin && hasCheckout;
  const activePhotos = activeTab === 'CHECKIN' ? checkinPhotos : checkoutPhotos;

  const TAB_CFG = {
    CHECKIN: {
      icon: LogIn,
      label: 'Check-in',
      count: checkinPhotos.length,
      accent: 'text-forest-800',
      activeBg: 'bg-forest-50 border-forest-100',
      dot: 'bg-lime-400',
      gradient: 'from-forest-800 to-forest-950',
    },
    CHECKOUT: {
      icon: LogOut,
      label: 'Check-out',
      count: checkoutPhotos.length,
      accent: 'text-forest-800',
      activeBg: 'bg-forest-50 border-forest-100',
      dot: 'bg-lime-400',
      gradient: 'from-forest-800 to-forest-950',
    },
  } as const;

  function openLightbox(photos: Photo[], index: number) {
    setLightbox({ photos, index });
  }

  if (!hasCheckin && !hasCheckout) return null;

  return (
    <>
      <div className={cn(
        'bg-background-card border border-border/80 rounded-card overflow-hidden shadow-2xs',
      )}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Camera className="w-4 h-4 text-lime-400" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-forest-950">Photos état des lieux</span>
              <p className="text-xs text-foreground-muted mt-0.5">
                {checkinPhotos.length + checkoutPhotos.length} photo{(checkinPhotos.length + checkoutPhotos.length) > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>

          {/* Verification badge */}
          {hasBoth && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-forest-50 border border-forest-100 text-xs font-bold text-forest-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
              Complet
            </span>
          )}
        </div>

        {/* ── Segmented Tabs ── */}
        {hasBoth && (
          <div className="px-6 pt-5">
            <div className="flex bg-background-alt rounded-inner p-1 border border-border/80">
              {(['CHECKIN', 'CHECKOUT'] as const).map((tab) => {
                const cfg = TAB_CFG[tab];
                const TabIcon = cfg.icon;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-inner text-xs font-bold transition-all duration-300',
                      isActive
                        ? 'bg-background-card shadow-2xs border border-border text-forest-950'
                        : 'text-foreground-muted hover:text-forest-950',
                    )}
                  >
                    <TabIcon className={cn('w-3.5 h-3.5', isActive ? cfg.accent : '')} />
                    {cfg.label}
                    <span className={cn(
                      'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill text-[10px] font-extrabold transition-all duration-300',
                      isActive
                        ? `bg-forest-950 text-lime-400 shadow-2xs`
                        : 'bg-background-alt text-foreground-muted',
                    )}>
                      {cfg.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Single tab header (when only one type exists) ── */}
        {!hasBoth && (
          <div className="px-6 pt-5">
            {(() => {
              const tab = hasCheckin ? 'CHECKIN' : 'CHECKOUT';
              const cfg = TAB_CFG[tab];
              const TabIcon = cfg.icon;
              return (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border text-xs font-bold',
                    cfg.activeBg, cfg.accent,
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-pill', cfg.dot)} />
                    <TabIcon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-foreground-muted font-medium">
                    — {cfg.count} photo{cfg.count > 1 ? 's' : ''}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Photo Grid ── */}
        <div className="p-6">
          <div className={cn(
            'grid gap-3 transition-all duration-300',
            activePhotos.length === 1
              ? 'grid-cols-1'
              : activePhotos.length === 2
              ? 'grid-cols-2'
              : activePhotos.length >= 5
              ? 'grid-cols-2 md:grid-cols-4'
              : 'grid-cols-2 md:grid-cols-3',
          )}>
            {activePhotos.map((photo, i) => (
              <PhotoGridItem
                key={photo.id}
                photo={photo}
                isLarge={activePhotos.length >= 5 && i === 0}
                onClick={() => openLightbox(activePhotos, i)}
              />
            ))}
          </div>

          {/* Summary under photos */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            {(() => {
              const cats = activePhotos.reduce<Record<string, number>>((acc, p) => {
                acc[p.categorie] = (acc[p.categorie] ?? 0) + 1;
                return acc;
              }, {});
              return Object.entries(cats).map(([cat, count]) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-foreground-muted"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-300" />
                  {CATEGORIE_LABEL[cat] ?? cat}
                  {count > 1 && <span className="text-forest-700">×{count}</span>}
                </span>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
