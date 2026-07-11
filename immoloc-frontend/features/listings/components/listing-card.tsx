'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Pencil,
  Send,
  Play,
  ImageOff,
  Plus,
  Home,
  CalendarCheck,
  ArrowUpRight,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import {
  ListingStatusBadge,
  type ListingStatut,
} from '@/features/listings/components/listing-status-badge';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ListingCard {
  id: string;
  titre: string;
  ville: string;
  type: string;
  prixBase: number;
  statut: ListingStatut;
  rejectionReason?: string | null;
  creeLe: string;
  photos: Array<{ id: string; url: string; estPrincipale: boolean }>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════════════════════════════════════ */

export function ListingCardSkeleton() {
  return (
    <div className="rounded-[20px] overflow-hidden border border-border bg-background-card animate-pulse">
      <div className="aspect-[4/3] bg-background-alt" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-1/3 bg-background-alt rounded-full" />
        <div className="h-5 w-3/4 bg-background-alt rounded-lg" />
        <div className="h-6 w-2/5 bg-background-alt rounded-lg" />
        <div className="h-10 w-full bg-background-alt rounded-xl mt-3" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Premium Listing Card — ImmoLoc
   ═══════════════════════════════════════════════════════════════════════════ */

export function ListingCardItem({ listing }: { listing: ListingCard }) {
  const principalPhoto =
    listing.photos.find((p) => p.estPrincipale) ?? listing.photos[0];

  const isActive = listing.statut === 'PUBLISHED';
  const isDraft = listing.statut === 'DRAFT';
  const isRejected = listing.statut === 'REJECTED';
  const isPaused = listing.statut === 'PAUSED';

  const showRejectBlock = isRejected && !!listing.rejectionReason;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
         MOBILE  (< sm) — immersif éditorial
         ══════════════════════════════════════════════════════════ */}
      <div className="sm:hidden bg-background-card rounded-[20px] border border-border overflow-hidden shadow-md active:scale-[0.985] transition-transform duration-200">
        {/* Photo héro */}
        <Link href={`/dashboard/annonces/${listing.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-background-alt">
            {principalPhoto ? (
              <Image
                src={principalPhoto.url}
                alt={listing.titre}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImageOff className="w-8 h-8 text-neutral-300" />
                <span className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider">
                  Aucune photo
                </span>
              </div>
            )}

            {/* Dégradés de lisibilité */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
            {!showRejectBlock && (
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
            )}

            {/* Statut — haut gauche */}
            <div className="absolute top-3 left-3">
              <ListingStatusBadge statut={listing.statut} />
            </div>

            {/* Compteur photos — haut droite */}
            {listing.photos.length > 1 && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md ring-1 ring-white/15">
                <Camera className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white tabular-nums">
                  {listing.photos.length}
                </span>
              </div>
            )}

            {/* Contenu superposé */}
            {!showRejectBlock && (
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3 h-3 text-white/70 shrink-0" />
                  <span className="text-[10px] font-bold text-white/75 uppercase tracking-[0.12em] truncate">
                    {listing.ville}
                  </span>
                  <span className="w-[3px] h-[3px] rounded-full bg-white/40 shrink-0" />
                  <span className="text-[10px] font-bold text-white/75 uppercase tracking-[0.12em] truncate">
                    {listing.type}
                  </span>
                </div>

                <h3 className="font-display text-base font-semibold text-white leading-snug line-clamp-2 mb-2 drop-shadow-sm">
                  {listing.titre}
                </h3>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-xl font-bold text-white tracking-tight tabular-nums">
                    {formatFCFA(listing.prixBase)}
                  </span>
                  <span className="text-[11px] font-semibold text-white/60">
                    FCFA · nuit
                  </span>
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Rejeté : motif + contenu au propre */}
        {showRejectBlock && (
          <div className="px-4 pt-3.5 pb-1">
            <div className="flex items-start gap-2 rounded-xl bg-error-500/10 border border-error-500/20 px-3 py-2.5 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-error-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-error-600 leading-snug line-clamp-2">
                {listing.rejectionReason}
              </p>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="w-3 h-3 text-foreground-muted shrink-0" />
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.12em] truncate">
                {listing.ville} · {listing.type}
              </span>
            </div>
            <h3 className="font-display text-base font-semibold text-foreground leading-snug line-clamp-1 mb-1">
              {listing.titre}
            </h3>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-lg font-bold text-foreground tracking-tight tabular-nums">
                {formatFCFA(listing.prixBase)}
              </span>
              <span className="text-[11px] font-semibold text-foreground-muted">
                FCFA · nuit
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pt-3 pb-4 border-t border-border">
          <span className="block text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-3">
            Créée le {formatDate(listing.creeLe)}
          </span>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/annonces/${listing.id}/modifier`}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-bold text-foreground bg-background-alt border border-border rounded-xl active:border-border-hover transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </Link>

            {(isDraft || isRejected) && (
              <Link
                href={`/dashboard/annonces/${listing.id}/soumettre`}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-sm shadow-emerald-600/25 active:bg-emerald-700 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Soumettre
              </Link>
            )}

            {isActive && (
              <Link
                href={`/dashboard/reservations?logement=${listing.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl active:bg-emerald-100 transition-colors"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Réservations
              </Link>
            )}

            {isPaused && (
              <Link
                href={`/dashboard/annonces/${listing.id}/reprendre`}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 text-xs font-bold text-success-600 bg-success-500/10 border border-success-500/20 rounded-xl active:bg-success-500/20 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Reprendre
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
         DESKTOP (≥ sm) — carte claire éditoriale (s'adapte au dark)
         ══════════════════════════════════════════════════════════ */}
      <div className="hidden sm:flex group bg-background-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-border-hover hover:-translate-y-1 transition-all duration-500 flex-col">
        <Link href={`/dashboard/annonces/${listing.id}`} className="block">
          <div className="aspect-[4/3] relative overflow-hidden bg-background-alt cursor-pointer">
            {principalPhoto ? (
              <Image
                src={principalPhoto.url}
                alt={listing.titre}
                fill
                className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-out"
                sizes="(max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImageOff className="w-10 h-10 text-neutral-300" />
                <span className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider">
                  Aucune photo
                </span>
              </div>
            )}

            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

            <div className="absolute top-3 left-3">
              <ListingStatusBadge statut={listing.statut} />
            </div>

            {listing.photos.length > 1 && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md ring-1 ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white tabular-nums">
                  {listing.photos.length}
                </span>
              </div>
            )}

            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-300">
              <div className="w-9 h-9 rounded-full bg-background-card flex items-center justify-center shadow-lg">
                <ArrowUpRight className="w-4 h-4 text-foreground" />
              </div>
            </div>

            {showRejectBlock && (
              <div className="absolute inset-x-0 bottom-0 flex items-start gap-2 px-4 py-3 bg-error-600/95 backdrop-blur-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold text-white leading-snug line-clamp-1">
                  {listing.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </Link>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-[11px] font-bold text-foreground-muted uppercase tracking-[0.12em] mb-2.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{listing.ville}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-border shrink-0" />
            <span className="truncate">{listing.type}</span>
          </div>

          <h3 className="font-display text-[17px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors duration-300 mb-3">
            {listing.titre}
          </h3>

          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="font-sans text-xl font-bold text-foreground tracking-tight tabular-nums">
              {formatFCFA(listing.prixBase)}
            </span>
            <span className="text-[11px] font-semibold text-foreground-muted">
              FCFA · nuit
            </span>
          </div>

          <div className="flex-1" />
          <div className="h-px bg-border mb-3.5" />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider shrink-0">
              {formatDate(listing.creeLe)}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/annonces/${listing.id}/modifier`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-foreground bg-background-alt border border-border hover:border-border-hover rounded-lg transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Modifier
              </Link>

              {(isDraft || isRejected) && (
                <Link
                  href={`/dashboard/annonces/${listing.id}/soumettre`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/25 transition-all"
                >
                  <Send className="w-3 h-3" />
                  Soumettre
                </Link>
              )}

              {isActive && (
                <Link
                  href={`/dashboard/reservations?logement=${listing.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <CalendarCheck className="w-3 h-3" />
                  Réservations
                </Link>
              )}

              {isPaused && (
                <Link
                  href={`/dashboard/annonces/${listing.id}/reprendre`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-success-600 bg-success-500/10 border border-success-500/20 hover:bg-success-500/20 rounded-lg transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Reprendre
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════════════════════════════════ */

export function ListingsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-background-alt border border-border flex items-center justify-center mb-5 shadow-sm">
        <Home className="w-7 h-7 text-neutral-300" />
      </div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-1.5">
        Aucune annonce pour l&apos;instant
      </h2>
      <p className="text-sm text-foreground-muted mb-6 max-w-xs leading-relaxed">
        Publiez votre premier logement pour commencer à recevoir des réservations.
      </p>
      <Link
        href="/dashboard/annonces/nouvelle"
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        Créer ma première annonce
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Error State
   ═══════════════════════════════════════════════════════════════════════════ */

export function ListingsErrorState() {
  return (
    <div className="flex items-start gap-3 bg-error-500/10 border border-error-500/20 rounded-2xl p-4">
      <AlertTriangle className="w-4 h-4 text-error-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm text-error-600 font-semibold">
          Impossible de charger vos annonces
        </p>
        <p className="text-[13px] text-error-600/80 mt-0.5">
          Rafraîchissez la page pour réessayer.
        </p>
      </div>
    </div>
  );
}