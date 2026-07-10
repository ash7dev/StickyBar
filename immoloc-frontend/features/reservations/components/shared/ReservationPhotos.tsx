'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Camera, X, ChevronLeft, ChevronRight,
  LogIn, LogOut, User, Home, ZoomIn,
  CheckCircle2, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from './reservation-cards';
import type { ReservationDetail } from '@/lib/nestjs/types';

/* ─── Types ───────────────────────────────────────────────────────────────── */

type Photo = ReservationDetail['photosEtatLieu'][number];

/* ─── Config ──────────────────────────────────────────────────────────────── */

const CATEGORIE_LABEL: Record<string, string> = {
  SALON: 'Salon', CHAMBRE: 'Chambre', CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle de bain', TERRASSE: 'Terrasse',
  VUE: 'Vue', ENTREE: 'Entrée', PISCINE: 'Piscine', AUTRE: 'Autre',
};

const UPLOADER_CFG: Record<string, { label: string; icon: typeof User; accent: string }> = {
  PROPRIO:   { label: 'Propriétaire', icon: Home, accent: 'text-primary-600 bg-primary-50 border-primary-100' },
  LOCATAIRE: { label: 'Locataire',    icon: User, accent: 'text-amber-600 bg-amber-50 border-amber-100'       },
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
  const photo       = photos[idx];
  const uploaderCfg = UPLOADER_CFG[photo.uploadePar] ?? UPLOADER_CFG.PROPRIO;
  const UploaderIcon = uploaderCfg.icon;

  const goNext = useCallback(() => setIdx((i) => (i + 1) % photos.length),              [photos.length]);
  const goPrev = useCallback(() => setIdx((i) => (i - 1 + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight')  goNext();
      if (e.key === 'ArrowLeft')   goPrev();
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
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      <div className="absolute top-4 left-4 z-20 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
        <span className="text-sm font-bold text-white tabular-nums">
          {idx + 1} <span className="text-white/50">/ {photos.length}</span>
        </span>
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 md:left-6 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm group"
          >
            <ChevronLeft className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 md:right-6 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm group"
          >
            <ChevronRight className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      <div className="relative z-10 w-full max-w-4xl max-h-[80vh] mx-4 md:mx-8">
        <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden bg-black/40">
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

        <div className="flex items-center justify-between gap-4 mt-4 px-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-white backdrop-blur-sm">
              <Camera className="w-3 h-3 text-white/60" />
              {CATEGORIE_LABEL[photo.categorie] ?? photo.categorie}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-white backdrop-blur-sm">
              <UploaderIcon className="w-3 h-3 text-white/60" />
              {uploaderCfg.label}
            </span>
          </div>
          <span className="text-xs font-medium text-white/50 shrink-0">
            {dateTimeFull(photo.creeLe)}
          </span>
        </div>
      </div>

      {photos.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl max-w-[90vw] overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIdx(i)}
              className={cn(
                'relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-200',
                i === idx
                  ? 'border-white shadow-lg shadow-white/20 scale-110'
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
  const uploaderCfg  = UPLOADER_CFG[photo.uploadePar] ?? UPLOADER_CFG.PROPRIO;
  const UploaderIcon = uploaderCfg.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/60',
        'transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/10 hover:border-neutral-300',
        'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-white/50 text-[10px] font-bold text-neutral-700 shadow-sm">
            {CATEGORIE_LABEL[photo.categorie] ?? photo.categorie}
          </span>
        </div>

        {/* Uploader badge (hover) */}
        <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold backdrop-blur-sm shadow-sm',
            uploaderCfg.accent,
          )}>
            <UploaderIcon className="w-2.5 h-2.5" />
            {uploaderCfg.label}
          </span>
        </div>

        {/* Date (hover) */}
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-[9px] font-bold text-white/80">
            <Clock className="w-2.5 h-2.5" />
            {dateTimeFull(photo.creeLe)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── Composant principal ─────────────────────────────────────────────────── */

export function ReservationPhotos({
  photosEtatLieu,
}: {
  photosEtatLieu: ReservationDetail['photosEtatLieu'];
}) {
  const checkinPhotos  = photosEtatLieu.filter((p) => p.type === 'CHECKIN');
  const checkoutPhotos = photosEtatLieu.filter((p) => p.type === 'CHECKOUT');

  const [activeTab, setActiveTab] = useState<'CHECKIN' | 'CHECKOUT'>(
    checkinPhotos.length > 0 ? 'CHECKIN' : 'CHECKOUT',
  );
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; index: number } | null>(null);

  const hasCheckin  = checkinPhotos.length > 0;
  const hasCheckout = checkoutPhotos.length > 0;
  const hasBoth     = hasCheckin && hasCheckout;
  const activePhotos = activeTab === 'CHECKIN' ? checkinPhotos : checkoutPhotos;

  const TAB_CFG = {
    CHECKIN: {
      icon: LogIn,
      label: 'Check-in',
      count: checkinPhotos.length,
      accent: 'text-emerald-600',
      activeBg: 'bg-emerald-50 border-emerald-200',
      dot: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
    },
    CHECKOUT: {
      icon: LogOut,
      label: 'Check-out',
      count: checkoutPhotos.length,
      accent: 'text-primary-600',
      activeBg: 'bg-primary-50 border-primary-200',
      dot: 'bg-primary-500',
      gradient: 'from-primary-500 to-primary-600',
    },
  } as const;

  if (!hasCheckin && !hasCheckout) return null;

  return (
    <>
      <GlassCard>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-neutral-800">Photos état des lieux</span>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {checkinPhotos.length + checkoutPhotos.length} photo{(checkinPhotos.length + checkoutPhotos.length) > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
          {hasBoth && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              Complet
            </span>
          )}
        </div>

        {/* Onglets segmentés — si les deux types existent */}
        {hasBoth && (
          <div className="px-5 pt-4">
            <div className="flex bg-neutral-100/80 rounded-xl p-1 border border-neutral-200/50">
              {(['CHECKIN', 'CHECKOUT'] as const).map((tab) => {
                const cfg = TAB_CFG[tab];
                const TabIcon = cfg.icon;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-300',
                      isActive
                        ? 'bg-white shadow-sm border border-neutral-200/60 text-neutral-900'
                        : 'text-neutral-400 hover:text-neutral-600',
                    )}
                  >
                    <TabIcon className={cn('w-3.5 h-3.5', isActive ? cfg.accent : '')} />
                    {cfg.label}
                    <span className={cn(
                      'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black transition-all duration-300',
                      isActive
                        ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-sm`
                        : 'bg-neutral-200/80 text-neutral-400',
                    )}>
                      {cfg.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* En-tête simple — si un seul type existe */}
        {!hasBoth && (
          <div className="px-5 pt-4">
            {(() => {
              const tab = hasCheckin ? 'CHECKIN' : 'CHECKOUT';
              const cfg = TAB_CFG[tab];
              const TabIcon = cfg.icon;
              return (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold',
                    cfg.activeBg, cfg.accent,
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                    <TabIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-neutral-400">
                    — {cfg.count} photo{cfg.count > 1 ? 's' : ''}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* Grille photos */}
        <div className="p-5">
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
                onClick={() => setLightbox({ photos: activePhotos, index: i })}
              />
            ))}
          </div>

          {/* Résumé par catégorie */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            {(() => {
              const cats = activePhotos.reduce<Record<string, number>>((acc, p) => {
                acc[p.categorie] = (acc[p.categorie] ?? 0) + 1;
                return acc;
              }, {});
              return Object.entries(cats).map(([cat, count]) => (
                <span key={cat} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neutral-400">
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  {CATEGORIE_LABEL[cat] ?? cat}
                  {count > 1 && <span className="text-neutral-300">×{count}</span>}
                </span>
              ));
            })()}
          </div>
        </div>
      </GlassCard>

      {/* Lightbox */}
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
