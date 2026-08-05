'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Pause, Volume2, VolumeX, X, Zap, ShieldCheck } from 'lucide-react';
import type { Listing } from '@/lib/nestjs/types';

interface Props {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoReelsModal({ listing, isOpen, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !listing.videoUrl) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      {/* Container type Smartphone / Reels 9:16 */}
      <div className="relative flex h-[85vh] max-h-[750px] w-full max-w-[420px] flex-col overflow-hidden rounded-[24px] border border-white/20 bg-black shadow-2xl">
        {/* Lecteur Vidéo */}
        <div className="relative flex-1 bg-black" onClick={togglePlay}>
          <video
            ref={videoRef}
            src={listing.videoUrl}
            loop
            playsInline
            muted={isMuted}
            className="h-full w-full object-cover"
          />

          {/* Icone Play quand la vidéo est en pause */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur-md">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Contrôles haut */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-pill bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
              🎬 Visite 360 / Reels
            </span>
            {listing.isInstantBooking && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-lime-400/90 px-2.5 py-0.5 text-[0.6875rem] font-extrabold text-forest-950">
                <Zap className="h-3 w-3 fill-forest-950" /> Instantané
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Overlay bas avec Infos & Bouton Réserver */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white space-y-3">
          <div>
            <span className="text-xs font-medium text-lime-400">{listing.ville}</span>
            <h3 className="font-display text-lg font-bold leading-snug line-clamp-2">
              {listing.titre}
            </h3>
            <p className="mt-1 text-sm font-semibold text-white">
              {new Intl.NumberFormat('fr-FR').format(listing.prixBase)} FCFA <span className="text-xs font-normal text-white/70">/ nuit</span>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/logements/${listing.id}`}
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-pill bg-lime-400 py-3 text-sm font-extrabold text-forest-950 transition-transform active:scale-95 shadow-lg hover:bg-lime-300"
            >
              <Zap className="h-4 w-4 fill-forest-950" />
              Réserver ce bien
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
