'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Film, Sparkles } from 'lucide-react';

interface Props {
  videoUrl: string;
  titre?: string;
}

export function ListingVideoSection({ videoUrl, titre }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section className="space-y-4 rounded-card border border-forest-500/20 bg-forest-950/95 text-white p-6 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-inner bg-lime-400/15 text-lime-400">
            <Film className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              Visite Vidéo du Logement
              <span className="rounded-pill bg-lime-400/20 px-2 py-0.5 text-[0.6875rem] font-bold text-lime-400">
                1m30 MAX
              </span>
            </h2>
            <p className="text-xs text-forest-200">
              Découvrez les pièces et l&apos;ambiance réelle du bien en vidéo HD.
            </p>
          </div>
        </div>
      </div>

      {/* Lecteur Vidéo */}
      <div className="relative aspect-video w-full overflow-hidden rounded-inner border border-white/10 bg-black group shadow-inner">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          loop
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="h-full w-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Overlay Play quand en pause */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[2px] transition-opacity"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-lime-400 text-forest-950 shadow-2xl transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 fill-forest-950 ml-1" />
            </div>
            <p className="mt-3 text-xs font-semibold text-white tracking-wide">
              Cliquez pour lancer la visite (1m30 max)
            </p>
          </div>
        )}

        {/* Barre de contrôles bas */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 transition-opacity">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
