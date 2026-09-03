'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import {
  Check, ChevronLeft, ChevronRight, Copy, Facebook, Grid2x2,
  ImageOff, MessageCircle, Share2, X, Zap, ZoomIn,
} from 'lucide-react';
import type { Listing } from '@/lib/nestjs';
import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';
import { cn } from '@/lib/utils/cn';

interface ListingHeaderProps {
  listing: Listing;
}

const fmtMoney = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function ListingHeader({ listing }: ListingHeaderProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Embla carousel pour la Lightbox plein écran
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });

  // Embla carousel pour le défilement mobile sur la fiche annonce
  const [mobileEmblaRef, mobileEmbla] = useEmblaCarousel({ loop: true });
  const [mobileIndex, setMobileIndex] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const photos = listing.photos ?? [];
  const main = photos.find((p) => p.estPrincipale) ?? photos[0];
  const secondary = photos.filter((p) => p.id !== main?.id).slice(0, 4);

  const derniereMinuteActive = Boolean((listing as { derniereMinuteActive?: boolean }).derniereMinuteActive);
  const prixAffiche = Math.round(Number(listing.prixBase || 0) * 1.07);
  const prixDerniereMinute = Math.round(prixAffiche * 0.85);

  // Sync index Lightbox
  useEffect(() => {
    if (!embla) return;
    const sync = () => setIndex(embla.selectedScrollSnap());
    embla.on('select', sync);
    embla.on('reInit', sync);
    sync();
    return () => {
      embla.off('select', sync);
      embla.off('reInit', sync);
    };
  }, [embla]);

  // Sync index Carousel Mobile
  useEffect(() => {
    if (!mobileEmbla) return;
    const syncMobile = () => setMobileIndex(mobileEmbla.selectedScrollSnap());
    mobileEmbla.on('select', syncMobile);
    mobileEmbla.on('reInit', syncMobile);
    syncMobile();
    return () => {
      mobileEmbla.off('select', syncMobile);
      mobileEmbla.off('reInit', syncMobile);
    };
  }, [mobileEmbla]);

  // Scroll Lightbox vers l'index demandé
  useEffect(() => {
    if (open && embla && pending !== null) {
      embla.scrollTo(pending, true);
      setPending(null);
    }
  }, [open, embla, pending]);

  // ── Clavier, verrou de défilement, focus ────────────────────────────────
  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); embla?.scrollPrev(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); embla?.scrollNext(); return; }
      if (e.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreFocus.current?.focus();
    };
  }, [open, embla]);

  const openAt = useCallback((i: number) => {
    setPending(i);
    setIndex(i);
    setOpen(true);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (navigator.share) {
        navigator.share({ title: listing.titre, url: window.location.href }).catch(() => { });
      }
    }
  };

  const share = (platform: 'whatsapp' | 'facebook' | 'x') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Découvrez ${listing.titre} sur Klef`);
    const map = {
      whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://x.com/intent/post?url=${url}&text=${text}`,
    };
    window.open(map[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="w-full space-y-4 sm:space-y-6">

      {/* ── Bouton Retour Mobile (avant les images) ────────────────────── */}
      <div className="md:hidden mt-2 mb-3">
        <Link
          href="/explorer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill border border-border bg-background-card text-xs font-semibold text-forest-800 shadow-xs transition-colors hover:bg-neutral-100 active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 text-forest-700" aria-hidden="true" />
          <span>Retour aux logements</span>
        </Link>
      </div>

      {/* ── Mosaïque / Carousel ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-card border border-border bg-background-alt shadow-sm">
        {photos.length > 0 ? (
          <>
            {/* ═══ CAROUSEL SWIPE MOBILE (md:hidden) ════════════════════════════ */}
            <div className="relative md:hidden h-[20rem] sm:h-[24rem] w-full overflow-hidden">
              <div ref={mobileEmblaRef} className="h-full w-full overflow-hidden">
                <div className="flex h-full">
                  {photos.map((photo, i) => (
                    <button
                      key={photo.id ?? i}
                      type="button"
                      onClick={() => openAt(i)}
                      aria-label={`Photo ${i + 1} sur ${photos.length} — Cliquer pour ouvrir la galerie`}
                      className="relative h-full flex-[0_0_100%] cursor-pointer group focus:outline-none"
                    >
                      <Image
                        src={photo.url}
                        alt={`${listing.titre} — photo ${i + 1}`}
                        fill
                        priority={i === 0}
                        sizes="100vw"
                        className="object-cover transition-transform duration-300 group-active:scale-[1.02]"
                      />
                      <span className="absolute inset-0 bg-forest-950/0 transition-colors group-active:bg-forest-950/15" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Flèches Mobile */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); mobileEmbla?.scrollPrev(); }}
                    aria-label="Photo précédente"
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-forest-950/50 text-white backdrop-blur-md transition-transform active:scale-90"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); mobileEmbla?.scrollNext(); }}
                    aria-label="Photo suivante"
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-forest-950/50 text-white backdrop-blur-md transition-transform active:scale-90"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {/* Badge Compteur dynamique mobile (ouvre la galerie au clic) */}
                  <button
                    type="button"
                    onClick={() => openAt(mobileIndex)}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-pill border border-white/60 bg-white/90 px-3 py-1 text-xs font-semibold text-forest-800 shadow-md backdrop-blur-md active:scale-95"
                  >
                    <Grid2x2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="tabular-nums">{mobileIndex + 1} / {photos.length}</span>
                  </button>

                  {/* Dots de défilement mobile */}
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-pill bg-forest-950/40 backdrop-blur-xs">
                    {photos.map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1.5 rounded-pill transition-all duration-300',
                          i === mobileIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ═══ GRILLE MOSAÏQUE DESKTOP (hidden md:grid) ═════════════════════ */}
            <div className="hidden md:grid h-[24rem] lg:h-[28rem] grid-cols-2 gap-2">
              {/* Photo principale */}
              <button
                type="button"
                onClick={() => openAt(0)}
                aria-label={`Ouvrir la galerie, ${photos.length} photos`}
                className="group relative h-full w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
              >
                {main ? (
                  <>
                    <Image
                      src={main.url}
                      alt=""
                      fill
                      priority
                      sizes="50vw"
                      className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
                    />
                    <span className="absolute inset-0 bg-forest-950/0 transition-colors duration-200 group-hover:bg-forest-950/10" />
                    <span className="glass-dark absolute bottom-4 left-4 hidden rounded-inner p-2.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 md:block">
                      <ZoomIn className="h-4 w-4 text-neutral-50" aria-hidden="true" />
                    </span>
                  </>
                ) : (
                  <span className="grid h-full place-items-center text-neutral-300">
                    <ImageOff className="h-8 w-8" aria-hidden="true" />
                  </span>
                )}
              </button>

              {/* Grille secondaire */}
              <div className="relative grid grid-cols-2 grid-rows-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => {
                  const photo = secondary[i];
                  const at = photo ? photos.findIndex((p) => p.id === photo.id) : 0;

                  return photo ? (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => openAt(at)}
                      aria-label={`Photo ${i + 2} sur ${photos.length}`}
                      className="group relative h-full w-full overflow-hidden bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
                    >
                      <Image
                        src={photo.url}
                        alt=""
                        fill
                        sizes="25vw"
                        className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
                      />
                      <span className="absolute inset-0 bg-forest-950/0 transition-colors duration-200 group-hover:bg-forest-950/10" />
                    </button>
                  ) : (
                    <div key={`empty-${i}`} className="h-full w-full bg-neutral-100" aria-hidden="true" />
                  );
                })}

                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    type="button"
                    onClick={() => openAt(0)}
                    className="inline-flex items-center gap-2 rounded-pill border border-white/60 bg-white/90 px-4 py-2.5 text-sm font-semibold text-forest-800 shadow-md backdrop-blur-md transition-colors duration-150 hover:bg-white"
                  >
                    <Grid2x2 className="h-4 w-4" aria-hidden="true" />
                    Voir les {photos.length} photos
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid h-64 place-items-center gap-2 text-foreground-muted">
            <ImageOff className="h-8 w-8 text-neutral-300" aria-hidden="true" />
            <p className="text-sm">Aucune photo disponible pour ce logement</p>
          </div>
        )}
      </div>

      {/* ── Prix et partage ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <TenantPriceDisplay
          prixBase={listing.prixBase}
          derniereMinuteActive={derniereMinuteActive}
          size="lg"
        />

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Partager
          </span>

          {/* WhatsApp est le canal de partage dominant au Sénégal : il mérite
              un libellé plutôt que d'être noyé parmi trois icônes identiques. */}
          <button
            type="button"
            onClick={() => share('whatsapp')}
            aria-label="Partager sur WhatsApp"
            className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-border bg-background-card px-3 text-xs font-semibold text-forest-800 shadow-xs transition-colors duration-150 hover:bg-neutral-100"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </button>

          {/* Les couleurs de marque (emerald, blue, sky) introduisaient trois
              teintes étrangères au système sur une même ligne. Neutres au
              repos, forest au survol. */}
          <IconAction label="Partager sur Facebook" onClick={() => share('facebook')}>
            <Facebook className="h-4 w-4" aria-hidden="true" />
          </IconAction>

          <IconAction label="Partager sur X" onClick={() => share('x')}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23zm-1.16 17.52h1.83L7.02 4.13H5.05l12.03 15.64z" />
            </svg>
          </IconAction>

          <IconAction label={copied ? 'Lien copié' : 'Copier le lien'} onClick={copyLink}>
            {copied
              ? <Check className="h-4 w-4 text-success-600" aria-hidden="true" />
              : <Copy className="h-4 w-4" aria-hidden="true" />}
          </IconAction>
          <span className="sr-only" role="status">{copied ? 'Lien copié' : ''}</span>
        </div>
      </div>

      {/* ── Visionneuse ──────────────────────────────────────────────────── */}
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Photos de ${listing.titre}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-forest-950/98 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-[calc(env(safe-area-inset-top,0px)+1rem)] backdrop-blur-xl sm:p-6"
        >
          <div className="z-30 flex w-full max-w-6xl items-center justify-between shrink-0 mb-2">
            <span className="rounded-pill border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-semibold tabular-nums text-white/90 shadow-xs">
              {index + 1} / {photos.length}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer la galerie"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-pill border border-white/30 bg-white/20 text-white shadow-xl backdrop-blur-md transition-all duration-150 hover:bg-white/35 active:scale-95 cursor-pointer"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div
            className="relative my-4 flex w-full max-w-5xl flex-1 items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={emblaRef} className="h-full w-full overflow-hidden">
              <div className="flex h-full">
                {photos.map((p, i) => (
                  <div key={p.id ?? i} className="relative h-full flex-[0_0_100%]">
                    <Image
                      src={p.url}
                      alt={`${listing.titre} — photo ${i + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {photos.length > 1 && (
              <>
                <LightboxArrow side="left" onClick={() => embla?.scrollPrev()} />
                <LightboxArrow side="right" onClick={() => embla?.scrollNext()} />
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div
              className="z-10 flex w-full max-w-2xl items-center justify-center gap-2 overflow-x-auto px-4 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, i) => (
                <button
                  key={p.id ?? i}
                  type="button"
                  onClick={() => embla?.scrollTo(i, true)}
                  aria-label={`Aller à la photo ${i + 1}`}
                  aria-current={i === index}
                  className={`relative h-10 w-14 shrink-0 overflow-hidden rounded-inner border-2 transition-all duration-150 ${i === index
                      // L'ambre codé en dur devient lime-400 : la couleur de
                      // marqueur du système sur fond sombre.
                      ? 'border-action opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                >
                  <Image src={p.url} alt="" fill sizes="60px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function IconAction({
  label, onClick, children,
}: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // title= n'est pas annoncé de façon fiable par les lecteurs d'écran.
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-pill border border-border bg-background-card text-foreground-muted shadow-xs transition-colors duration-150 hover:border-border-hover hover:text-forest-700"
    >
      {children}
    </button>
  );
}

function LightboxArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Photo précédente' : 'Photo suivante'}
      className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-pill border border-white/15 bg-forest-950/60 text-white backdrop-blur-md transition-colors duration-150 hover:bg-forest-950/80 ${side === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'
        }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}