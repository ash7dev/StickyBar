'use client';

import { useId, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle2, ShieldCheck, Sparkles, X, AlertTriangle } from 'lucide-react';

interface PhotoEntry {
  url: string;
  categorie?: string;
}

interface ConfirmCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  photos?: PhotoEntry[];
  onOpenGallery?: () => void;
}

export function ConfirmCheckinModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  photos = [],
  onOpenGallery,
}: ConfirmCheckinModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const count = photos.length;
  const previewPhotos = photos.slice(0, 3);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-forest-950/80 backdrop-blur-md"
        onClick={!loading ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-card border border-lime-400/25 bg-[linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] p-6 text-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Fermer"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-pill bg-white/10 text-forest-200 transition-colors hover:bg-white/20 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-pill border border-lime-400/30 bg-lime-400/10 text-lime-400 shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>

          <h2 id={titleId} className="mt-4 font-display text-xl font-semibold text-neutral-50">
            Valider votre arrivée ?
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-forest-200">
            Confirmation de votre entrée dans les lieux et déblocage immédiat du paiement.
          </p>
        </div>

        {count > 0 ? (
          <div className="mt-5 rounded-inner border border-white/10 bg-white/[0.05] p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-50">
              <Camera className="h-4 w-4 text-lime-400" />
              <span>{count} photo{count > 1 ? 's' : ''} d'état des lieux d'entrée</span>
            </div>

            <div className="flex gap-2">
              {previewPhotos.map((p, idx) => (
                <div key={idx} className="relative aspect-video flex-1 overflow-hidden rounded-inner border border-white/10 bg-black/30">
                  <Image src={p.url} alt="" fill sizes="120px" className="object-cover" />
                </div>
              ))}
              {count > 3 && (
                <div className="flex h-auto w-14 flex-col items-center justify-center rounded-inner border border-lime-400/30 bg-forest-950/80 text-xs font-bold text-lime-300">
                  +{count - 3}
                </div>
              )}
            </div>

            {onOpenGallery && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGallery();
                }}
                className="w-full text-center text-xs font-medium text-lime-400 underline underline-offset-2 transition-colors hover:text-lime-300"
              >
                Vérifier les photos avant validation
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 flex items-start gap-3 rounded-inner border border-warning-500/30 bg-warning-500/10 p-3.5 text-xs text-warning-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning-400" />
            <p className="leading-relaxed">
              Aucune photo d'état des lieux téléversée par l'hôte. Assurez-vous d'avoir inspecté le logement avant de confirmer.
            </p>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-inner border border-lime-400/20 bg-lime-400/10 p-3.5 text-xs text-forest-200">
          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-lime-400" />
          <div>
            <p className="font-semibold text-lime-300">Déblocage du séquestre Klef</p>
            <p className="mt-0.5 leading-relaxed">
              En confirmant, vous attestez que le logement est conforme. Les fonds seront transférés sur le portefeuille de l'hôte.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-action py-3.5 text-sm font-semibold text-on-action shadow-action transition-colors hover:bg-action-hover disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-950 border-t-transparent" />
                Validation en cours…
              </span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Oui, confirmer mon entrée 🎉
              </>
            )}
          </button>

          {!loading && (
            <button
              type="button"
              onClick={onClose}
              className="py-2 text-center text-xs text-forest-200 transition-colors hover:text-white"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
