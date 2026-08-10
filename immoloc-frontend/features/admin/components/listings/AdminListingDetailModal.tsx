'use client';

import { useEffect, useState } from 'react';
import { X, Check, Pause, Star, MapPin, Building2, User, BadgeDollarSign, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ListingItem } from './AdminListingsTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface AdminListingDetailModalProps {
  listing: ListingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPublish: (listing: ListingItem) => void;
  onReject: (listing: ListingItem) => void;
  onSuspend: (listing: ListingItem) => void;
  onUnsuspend: (listing: ListingItem) => void;
}

function formatPrice(price?: number) {
  if (price == null) return '—';
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(price);
}

export function AdminListingDetailModal({
  listing,
  isOpen,
  onClose,
  onPublish,
  onReject,
  onSuspend,
  onUnsuspend,
}: AdminListingDetailModalProps) {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!listing?.id || !isOpen) {
      setDetails(null);
      setPhotoIndex(0);
      return;
    }
    setIsLoadingDetails(true);
    adminApi.getListingDetails(listing.id)
      .then((data) => setDetails(data))
      .catch(() => setDetails(null))
      .finally(() => setIsLoadingDetails(false));
  }, [listing?.id, isOpen]);

  if (!isOpen || !listing) return null;

  const photos: Array<{ url: string; categorie?: string }> = details?.photos ?? listing.photos ?? [];
  const equipements: Array<{ equipement?: { nom: string; icone?: string } }> = details?.equipements ?? [];
  const ownerName = listing.proprietaire
    ? `${listing.proprietaire.prenom ?? ''} ${listing.proprietaire.nom ?? ''}`.trim()
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">{listing.titre}</h2>
              <p className="text-xs text-foreground-muted">Inspection détaillée de l'annonce — {listing.type ?? 'Logement'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
          </div>
        ) : (
          <>
            {/* Galerie Photo */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Galerie Photos</h3>
                <div className="relative">
                  <div className="h-64 w-full overflow-hidden rounded-inner border border-border bg-background-alt sm:h-80">
                    <img
                      src={photos[photoIndex]?.url}
                      alt={`Photo ${photoIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                        className="absolute top-1/2 left-2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-forest-950/50 text-neutral-0 hover:bg-forest-950/70"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                        className="absolute top-1/2 right-2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-forest-950/50 text-neutral-0 hover:bg-forest-950/70"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-2 right-2 rounded-pill bg-forest-950/60 px-2.5 py-1 text-[0.6875rem] font-semibold text-neutral-0">
                        {photoIndex + 1} / {photos.length}
                      </span>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhotoIndex(i)}
                        className={cn(
                          'h-14 w-20 shrink-0 overflow-hidden rounded-inner border-2 transition-all',
                          i === photoIndex ? 'border-forest-600 shadow-xs' : 'border-border opacity-60 hover:opacity-100',
                        )}
                      >
                        <img src={p.url} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Informations clé */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-inner border border-border bg-background-alt/40 p-4">
              <div className="space-y-1">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Type de logement</p>
                <p className="text-xs font-bold text-foreground">{details?.type ?? listing.type ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Localisation</p>
                <p className="text-xs font-bold text-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-foreground-muted" />
                  {details?.ville ?? listing.ville ?? '—'}{details?.quartier ? `, ${details.quartier}` : ''}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">Prix de base / Nuit</p>
                <p className="font-display text-sm font-bold text-foreground tabular-nums">{formatPrice(details?.prixBase ?? listing.prixBase)}</p>
              </div>
            </div>

            {/* Capacité */}
            {details && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Chambres', value: details.nbChambres },
                  { label: 'Salles de bain', value: details.nbSallesDeBain },
                  { label: 'Capacité max.', value: details.capaciteMax ? `${details.capaciteMax} pers.` : null },
                  { label: 'Surface', value: details.superficie ? `${details.superficie} m²` : null },
                ].filter(d => d.value != null).map((d) => (
                  <div key={d.label} className="rounded-inner border border-border bg-background-card p-3 text-center space-y-0.5">
                    <p className="text-[0.6875rem] font-semibold text-foreground-muted">{d.label}</p>
                    <p className="font-display text-sm font-bold text-foreground">{d.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {details?.description && (
              <div className="space-y-1">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Description</h3>
                <p className="text-xs leading-relaxed text-foreground-muted whitespace-pre-line">{details.description}</p>
              </div>
            )}

            {/* Équipements */}
            {equipements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {equipements.map((eq, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-alt px-3 py-1.5 text-[0.6875rem] font-semibold text-foreground">
                      {eq.equipement?.icone && <span>{eq.equipement.icone}</span>}
                      {eq.equipement?.nom ?? 'Équipement'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Propriétaire */}
            <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Propriétaire
              </p>
              <p className="text-xs font-bold text-foreground">{ownerName}</p>
              <p className="text-[0.6875rem] text-foreground-muted">{listing.proprietaire?.email}</p>
            </div>

            {/* Raison du rejet */}
            {(details?.rejectionReason || listing.rejectionReason) && (
              <div className="rounded-inner border border-error-200 bg-error-50 p-3.5 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-error-800">Motif du rejet :</p>
                <p className="text-xs text-error-900">{details?.rejectionReason ?? listing.rejectionReason}</p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
            Fermer
          </button>

          {listing.statut === 'PENDING_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => { onClose(); onReject(listing); }}
                className="h-9 rounded-inner border border-error-200 bg-error-50 px-4 text-xs font-semibold text-error-700 hover:bg-error-100"
              >
                Rejeter
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onPublish(listing); }}
                className="inline-flex h-9 items-center gap-1.5 rounded-inner bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
              >
                <Check className="h-4 w-4" />
                <span>Publier l'annonce</span>
              </button>
            </>
          )}

          {listing.statut === 'PUBLISHED' && (
            <button
              type="button"
              onClick={() => { onClose(); onSuspend(listing); }}
              className="h-9 rounded-inner border border-warning-200 bg-warning-50 px-4 text-xs font-semibold text-warning-800 hover:bg-warning-100"
            >
              Suspendre
            </button>
          )}

          {listing.statut === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => { onClose(); onUnsuspend(listing); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-inner bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
            >
              <Check className="h-4 w-4" />
              <span>Réactiver</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
