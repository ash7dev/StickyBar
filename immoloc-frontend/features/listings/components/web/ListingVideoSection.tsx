'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Film } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  videoUrl: string;
  titre?: string;
  /** Première photo du bien — évite le flash noir avant la première frame. */
  posterUrl?: string;
}

export function ListingVideoSection({ videoUrl, titre, posterUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

  /* Le ratio est détecté au chargement des métadonnées plutôt que forcé en
     16/9. Un propriétaire qui filme au téléphone produit du vertical :
     `object-contain` dans un cadre 16/9 laissait alors deux bandes noires
     occupant les deux tiers de la largeur. */
  const handleMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    setIsVertical(v.videoHeight > v.videoWidth);
  }, []);

  const start = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    v.play().catch(() => setStarted(false));
  }, []);

  /* iOS n'expose pas `requestFullscreen` sur les éléments : sans ce repli,
     le plein écran ne fonctionnait pas du tout sur iPhone. Les contrôles
     natifs le gèrent seuls, plus besoin de bouton maison. */
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.setAttribute('webkit-playsinline', 'true');
  }, []);

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <Film className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Visite en vidéo
          </h2>
          <p className="text-xs text-foreground-muted">
            Les pièces et l’ambiance réelle du logement
          </p>
        </div>
      </header>

      <div
        className={cn(
          'relative mx-auto w-full overflow-hidden rounded-card border border-border bg-background-alt',
          isVertical ? 'aspect-[9/16] max-w-sm' : 'aspect-video',
        )}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          playsInline
          preload="metadata"
          controls={started}
          onLoadedMetadata={handleMetadata}
          onEnded={() => setStarted(false)}
          aria-label={titre ? `Visite vidéo — ${titre}` : 'Visite vidéo du logement'}
          className="h-full w-full object-cover"
        />

        {/* Un seul état avant lecture. Les contrôles natifs prennent le
            relais ensuite : barre de progression, durée, volume, plein écran
            et navigation clavier, qui manquaient tous aux contrôles maison. */}
        {!started && (
          <button
            type="button"
            onClick={start}
            aria-label="Lancer la visite vidéo"
            className="group absolute inset-0 grid place-items-center bg-forest-950/25 transition-colors hover:bg-forest-950/35"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-neutral-0/95 text-forest-900 shadow-lg transition-transform group-hover:scale-105">
              <Play className="ml-1 h-6 w-6 fill-current" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
    </section>
  );
}