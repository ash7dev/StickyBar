'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Volume2, VolumeX, X, Zap } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';
import { useCurrencyStore } from '@/stores/currency.store';

/**
 * Majoration appliquée au prix de base avant affichage.
 * ⚠️ NE JAMAIS RETIRER — c'est le prix public de Klef. Si ce fichier affiche
 * prixBase brut, le montant du reel diffère de celui de la fiche et du
 * checkout, et l'utilisateur constate une hausse au moment de payer.
 *
 * À déplacer dans `@/lib/pricing` et importer partout plutôt que redéclarer.
 */
const MARKUP = 1.07;

const formatPrixPublic = (prixBase: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(prixBase * MARKUP));

interface Props {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  /** Première photo du bien — évite le flash noir avant la première frame. */
  posterUrl?: string;
}

export function VideoReelsModal({ listing, isOpen, onClose, posterUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const titleId = `reel-titre-${listing.id}`;

  /* ── Lecture ─────────────────────────────────────────────────────────────
     play() renvoie une promesse : sans .catch(), un refus d'autoplay du
     navigateur remonte en unhandled rejection.                             */

  const requestPlay = useCallback(() => {
    videoRef.current?.play().catch(() => setIsPlaying(false));
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) requestPlay();
    else video.pause();
  }, [requestPlay]);

  /* isPlaying est piloté par les événements du <video>, pas par le clic.
     C'est ce qui corrigeait le bug de réouverture : après une pause, une
     fermeture puis une réouverture, l'état restait à false et l'icône Play
     se superposait à une vidéo qui tournait.                               */

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video?.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  /* ── Ouverture : rembobinage + lecture ─────────────────────────────────── */

  useEffect(() => {
    if (!isOpen) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setProgress(0);
    requestPlay();
  }, [isOpen, requestPlay]);

  /* ── Verrou de scroll ────────────────────────────────────────────────────
     On restaure la valeur précédente au lieu de forcer '' : si un autre
     overlay est déjà ouvert, le remettre à vide déverrouille sa page.      */

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  /* ── Focus : capture, piège, restitution ─────────────────────────────────
     Sans piège, Tab sort de la modale et l'utilisateur au clavier se
     retrouve à naviguer une page qu'il ne voit plus.                       */

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], video[controls], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !listing.videoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-forest-950/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Cadre 9:16. Le noir du système est vert (#041912), pas #000. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[85vh] max-h-[750px] w-full max-w-[420px] flex-col overflow-hidden rounded-card border border-white/15 bg-forest-950 shadow-xl"
      >
        {/* ── Lecteur ────────────────────────────────────────────────────── */}

        <video
          ref={videoRef}
          src={listing.videoUrl}
          poster={posterUrl}
          loop
          playsInline
          preload="auto"
          muted={isMuted}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          className="h-full w-full object-cover"
        />

        {/* Zone de tap : un vrai bouton plein cadre plutôt qu'un onClick sur
            un div — accessible au clavier, annoncé par les lecteurs d'écran. */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Mettre en pause' : 'Reprendre la lecture'}
          className="absolute inset-0 grid place-items-center focus-visible:outline-offset-[-4px]"
        >
          {!isPlaying && (
            <span className="grid h-16 w-16 place-items-center rounded-pill bg-forest-950/45 backdrop-blur-md">
              <Play className="ml-1 h-8 w-8 fill-neutral-50 text-neutral-50" />
            </span>
          )}
        </button>

        {/* ── Progression ────────────────────────────────────────────────────
            Blanche, pas lime : le lime est réservé à l'action. Une barre
            lime au-dessus d'un CTA lime met les deux au même niveau.        */}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-neutral-50/20">
          <div
            className="h-full bg-neutral-50/90 transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── Contrôles haut ─────────────────────────────────────────────── */}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-forest-950/80 to-transparent p-4 pt-5">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-forest-950/50 px-3 py-1 text-xs font-semibold text-neutral-50 backdrop-blur-md">
              Visite vidéo
            </span>

            {/* Réservation instantanée : chip sombre + icône lime.
                Le lime marque, il ne remplit pas — un seul aplat lime par
                écran, et c'est le CTA en bas.                              */}
            {listing.isInstantBooking && (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-action/25 bg-marker-bg px-2.5 py-1 text-xs font-semibold text-neutral-50 backdrop-blur-md">
                <Zap className="h-3 w-3 fill-lime-300 text-on-inverse-marker" />
                Instantané
              </span>
            )}
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
              aria-pressed={isMuted}
              className="grid h-9 w-9 place-items-center rounded-pill bg-forest-950/50 text-neutral-50 backdrop-blur-md transition-colors hover:bg-forest-950/75"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Fermer la visite"
              className="grid h-9 w-9 place-items-center rounded-pill bg-forest-950/50 text-neutral-50 backdrop-blur-md transition-colors hover:bg-forest-950/75"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Infos & conversion ─────────────────────────────────────────── */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-forest-950/95 via-forest-950/65 to-transparent p-5 pt-12 text-neutral-50">
          <div>
            {/* La ville était en lime-400 : c'était du texte porté par
                l'accent, à deux centimètres d'un CTA lime. Neutralisée. */}
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-50/65">
              {listing.ville}
            </span>
            <h3
              id={titleId}
              className="mt-1 font-display text-lg font-semibold leading-snug text-neutral-50 line-clamp-2"
            >
              {listing.titre}
            </h3>
            <p className="mt-1.5 text-sm font-semibold tabular-nums text-neutral-50">
              {useCurrencyStore.getState().formatAmount(Math.round(listing.prixBase * MARKUP))}
              <span className="ml-1 text-xs font-normal text-neutral-50/70">/ nuit</span>
            </p>
          </div>

          <Link
            href={`/logements/${listing.id}`}
            onClick={onClose}
            className="pointer-events-auto inline-flex w-full items-center justify-center gap-2 rounded-pill bg-action py-3.5 text-sm font-semibold text-on-action shadow-action transition-[background-color,transform] duration-150 hover:bg-action-hover active:scale-[0.98]"
          >
            <Zap className="h-4 w-4 fill-forest-800 text-forest-800" />
            Réserver ce bien
          </Link>
        </div>
      </div>
    </div>
  );
}