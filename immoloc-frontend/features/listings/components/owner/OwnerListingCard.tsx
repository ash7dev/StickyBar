'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, Edit3, ExternalLink, Eye, ImageOff, MapPin,
  MoreVertical, PauseCircle, PlayCircle, Trash2, Zap, AlertTriangle, User
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const fcfa = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export interface OwnerListing {
  id: string;
  slug?: string;
  titre: string;
  ville?: string;
  commune?: string;
  statut: string;
  prixParNuit?: number | string;
  prixNuit?: number | string;
  prixBase?: number | string;
  typeLogement?: string;
  capacity?: number;
  derniereMinuteActive?: boolean;
  photos?: Array<{ url: string } | string>;
  createdAt?: string;
}

interface Props {
  listing: OwnerListing;
  viewMode?: 'list' | 'grid';
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onToggleDerniereMinute?: (id: string, active: boolean) => void;
  onDelete?: (id: string) => void;
  isGestionnaire?: boolean;
}

/* Statuts pensés pour un fond CLAIR : ces cartes vivent sur le canvas, pas
   sur une surface sombre. L'ancien PUBLISHED mettait un aplat forest-950 avec
   texte lime sur une carte blanche — l'élément le plus sombre de la page
   servait à dire « tout va bien ». */
/* ── Statuts avec design tokens officiels Klef ─────────────────────────── */
const STATUT_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PUBLISHED: {
    label: 'Publiée',
    cls: 'bg-success-50 text-success-700 border-success-500/30 shadow-2xs',
    dot: 'bg-success-500',
  },
  PENDING_REVIEW: {
    label: 'En révision',
    cls: 'bg-warning-50 text-warning-700 border-warning-500/30 shadow-2xs',
    dot: 'bg-warning-500',
  },
  DRAFT: {
    label: 'Brouillon',
    cls: 'bg-background-alt text-foreground-muted border-border shadow-2xs',
    dot: 'bg-neutral-400',
  },
  PAUSED: {
    label: 'En pause',
    cls: 'bg-background-alt text-foreground-muted border-border shadow-2xs',
    dot: 'bg-neutral-400',
  },
  REJECTED: {
    label: 'Rejetée',
    cls: 'bg-error-50 text-error-700 border-error-500/30 shadow-2xs',
    dot: 'bg-error-500',
  },
};

export function OwnerListingCard({
  listing,
  viewMode = 'grid',
  onToggleStatus,
  onToggleDerniereMinute,
  onDelete,
  isGestionnaire = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rawPrice = listing.prixParNuit ?? listing.prixNuit ?? listing.prixBase ?? 0;
  const num = Number(rawPrice);
  const price = Number.isFinite(num) ? fcfa.format(num) : '—';

  const first = listing.photos?.[0];
  const photo = typeof first === 'string' ? first : first?.url;

  const cfg = STATUT_CONFIG[listing.statut] ?? STATUT_CONFIG.DRAFT;
  const location = [listing.commune, listing.ville].filter(Boolean).join(', ') || 'Sénégal';
  const detailHref = isGestionnaire ? `/gestionnaire/annonces/${listing.id}` : `/dashboard/annonces/${listing.id}`;
  const editHref = isGestionnaire ? `/gestionnaire/annonces/${listing.id}/modifier` : `/dashboard/annonces/${listing.id}/modifier`;
  const proprietaire = (listing as any).proprietaire;

  const StatusBadge = (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide backdrop-blur-md',
      cfg.cls,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot)} />
      {cfg.label}
    </span>
  );

  const PriceDisplay = (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-semibold tabular-nums text-forest-900">{price}</span>
      <span className="text-xs text-foreground-muted">FCFA / nuit</span>
    </div>
  );

  /* ── Mode liste ─────────────────────────────────────────────────────── */
  if (viewMode === 'list') {
    return (
      <article className={cn(
        "group relative flex flex-col rounded-card border border-border bg-background-card shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/30 hover:shadow-md overflow-hidden",
        menuOpen ? "z-[60]" : "z-0 hover:z-20"
      )}>
        {/* Top row: photo + info */}
        <div className="flex min-w-0 items-start gap-3.5 p-4 pb-3">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-inner bg-neutral-100 shadow-inner">
            {photo ? (
              <Image
                src={photo}
                alt=""
                fill
                sizes="96px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <span className="grid h-full place-items-center text-neutral-300">
                <ImageOff className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/40 via-transparent to-transparent opacity-60" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {StatusBadge}
              {listing.typeLogement && (
                <span className="rounded-pill bg-neutral-100 border border-border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-foreground-muted">
                  {listing.typeLogement}
                </span>
              )}
              {listing.derniereMinuteActive && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-gold-50 border border-gold-200 px-2 py-0.5 text-[0.6rem] font-bold text-gold-800 shadow-2xs">
                  <Zap className="h-2.5 w-2.5 fill-gold-400 text-gold-500" />
                  -15%
                </span>
              )}
            </div>

            {/* Title - 2 lines allowed */}
            <h3 className="font-display text-sm font-semibold leading-snug tracking-[-0.015em] text-forest-900 group-hover:text-forest-600 transition-colors">
              <Link
                href={detailHref}
                className="line-clamp-2 focus-visible:outline-none"
              >
                {listing.titre}
              </Link>
            </h3>

            {/* Location */}
            <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-foreground-muted font-medium">
              <span className="flex items-center gap-1 text-forest-800">
                <MapPin className="h-3 w-3 shrink-0 text-foreground-faint" aria-hidden="true" />
                <span className="truncate max-w-[160px]">{location}</span>
              </span>

              {isGestionnaire && proprietaire && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-forest-50 border border-forest-100 px-2 py-0.5 text-[0.6rem] font-semibold text-forest-700 truncate max-w-[180px]">
                  <User className="h-2.5 w-2.5 text-forest-600 shrink-0" /> {proprietaire.prenom} {proprietaire.nom}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: price + action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-semibold tabular-nums text-forest-900">{price}</span>
            <span className="text-[0.65rem] text-foreground-muted">FCFA / nuit</span>
          </div>

          <div className="relative z-20 flex items-center gap-1.5">
            <Link
              href={detailHref}
              className="inline-flex items-center gap-1 rounded-pill border border-border bg-background-card hover:bg-neutral-100 px-2.5 py-1.5 text-[0.7rem] font-semibold text-foreground transition-all shadow-2xs"
            >
              <Eye className="h-3 w-3 text-forest-600" aria-hidden="true" />
              <span>Gérer</span>
            </Link>

            <Link
              href={editHref}
              className="btn-action inline-flex items-center gap-1 rounded-pill px-2.5 py-1.5 text-[0.7rem] font-semibold text-on-action transition-all shadow-xs active:scale-95 border-none"
            >
              <Edit3 className="h-3 w-3 text-forest-950 stroke-[2px]" aria-hidden="true" />
              <span>Modifier</span>
            </Link>

            <ActionsMenu listing={listing} onToggleStatus={onToggleStatus} onToggleDerniereMinute={onToggleDerniereMinute} onDelete={onDelete} onOpenChange={setMenuOpen} isGestionnaire={isGestionnaire} />
          </div>
        </div>
      </article>
    );
  }


  /* ── Mode grille ────────────────────────────────────────────────────── */
  return (
    <article className={cn(
      "group relative flex flex-col rounded-card border border-border bg-background-card shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/30 hover:shadow-md",
      menuOpen ? "z-[60]" : "z-0 hover:z-20"
    )}>
      {/* ── Photo & Badges ────────────────────────────────────────────── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-card bg-neutral-100">
        {photo ? (
          <Image
            src={photo}
            alt={listing.titre}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-neutral-300">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </span>
        )}

        {/* Dégradé sous l'image */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent opacity-80" />

        {/* Badges haut gauche */}
        <div className="absolute left-3 top-3 flex flex-col gap-1 z-20">
          {StatusBadge}
          {listing.derniereMinuteActive && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-gold-400 text-forest-950 px-2.5 py-0.5 text-[0.65rem] font-bold shadow-sm">
              <Zap className="h-3 w-3 fill-forest-950" />
              -15% Dernière Min.
            </span>
          )}
        </div>

        {/* Menu d'actions haut droit */}
        <div className="absolute right-3 top-3 z-30">
          <ActionsMenu listing={listing} onToggleStatus={onToggleStatus} onToggleDerniereMinute={onToggleDerniereMinute} onDelete={onDelete} onPhoto onOpenChange={setMenuOpen} isGestionnaire={isGestionnaire} />
        </div>

        {/* Badge Bailleur en bas sur la photo */}
        {isGestionnaire && proprietaire && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-forest-950/80 border border-white/20 backdrop-blur-md px-2.5 py-0.5 text-[0.6875rem] font-semibold text-neutral-0 shadow-sm truncate max-w-[85%]">
              <User className="h-3 w-3 text-gold-300 shrink-0" />
              <span className="truncate">Bailleur : {proprietaire.prenom} {proprietaire.nom}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Contenu de la Carte ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Type + Location */}
        <div className="flex items-center gap-2">
          {listing.typeLogement && (
            <span className="shrink-0 rounded-pill bg-neutral-100 border border-border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-foreground-muted">
              {listing.typeLogement}
            </span>
          )}
          <p className="flex items-center gap-1 text-xs text-foreground-muted truncate font-medium min-w-0">
            <MapPin className="h-3 w-3 shrink-0 text-foreground-faint" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        {/* Title */}
        <h3 className="font-display text-sm sm:text-base font-semibold leading-snug tracking-[-0.015em] text-forest-900 group-hover:text-forest-600 transition-colors line-clamp-2">
          <Link
            href={detailHref}
            className="focus-visible:outline-none"
          >
            {listing.titre}
          </Link>
        </h3>

        {/* ── Prix & Boutons d'Action ─────────────────────────────────── */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-semibold tabular-nums text-forest-900">{price}</span>
            <span className="text-[0.65rem] text-foreground-muted">FCFA / nuit</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={detailHref}
              className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-card hover:bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-foreground transition-all shadow-2xs"
              title="Gérer l'annonce et voir le calendrier"
            >
              <Eye className="h-3.5 w-3.5 text-forest-600" />
              <span>Gérer</span>
            </Link>

            <Link
              href={editHref}
              className="btn-action inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold text-on-action transition-all shadow-xs active:scale-95 border-none"
              title="Modifier les détails de l'annonce"
            >
              <Edit3 className="h-3.5 w-3.5 text-forest-950 stroke-[2px]" />
              <span>Modifier</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Vignette ───────────────────────────────────────────────────────────── */

function Thumb({ photo, className }: { photo?: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-inner bg-neutral-100', className)}>
      {photo ? (
        <Image src={photo} alt="" fill sizes="112px" className="object-cover" />
      ) : (
        <span className="grid h-full place-items-center text-neutral-300">
          <ImageOff className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

/* ── Menu d'actions ─────────────────────────────────────────────────────── */

function ActionsMenu({
  listing, onToggleStatus, onToggleDerniereMinute, onDelete, onPhoto = false, onOpenChange, isGestionnaire = false,
}: {
  listing: OwnerListing;
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onToggleDerniereMinute?: (id: string, active: boolean) => void;
  onDelete?: (id: string) => void;
  onPhoto?: boolean;
  onOpenChange?: (open: boolean) => void;
  isGestionnaire?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const editHref = isGestionnaire ? `/gestionnaire/annonces/${listing.id}/modifier` : `/dashboard/annonces/${listing.id}/modifier`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleOpen = (val?: boolean) => {
    setOpen((prev) => (val !== undefined ? val : !prev));
  };

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) toggleOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { toggleOpen(false); btnRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-2.5 rounded-inner px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-neutral-100 cursor-pointer';

  return (
    <>
      <div ref={ref} className={cn("relative shrink-0", open ? "z-50" : "z-20")}>
        <button
          ref={btnRef}
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleOpen(); }}
          aria-label={`Actions pour ${listing.titre}`}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={open ? menuId : undefined}
          className={cn(
            'grid h-9 w-9 place-items-center rounded-pill border transition-colors duration-150 cursor-pointer',
            onPhoto
              ? 'border-white/60 bg-white/85 text-forest-800 backdrop-blur-md hover:bg-white'
              : 'border-border bg-background-card text-foreground-muted hover:bg-neutral-100 hover:text-forest-700',
          )}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        {open && (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-60 space-y-0.5 overflow-hidden rounded-card border border-border bg-background-card p-1.5 shadow-lg"
          >
            <Link href={editHref} role="menuitem" className={item}>
              <Edit3 className="h-4 w-4 text-forest-600" aria-hidden="true" />
              Modifier l&apos;annonce
            </Link>

            {isGestionnaire && (
              <Link href={`/gestionnaire/annonces/${listing.id}`} role="menuitem" className={item}>
                <Eye className="h-4 w-4 text-forest-600" aria-hidden="true" />
                Détail & Calendrier Conciergerie
              </Link>
            )}

            <Link
              href={`/logements/${listing.slug ?? listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className={item}
            >
              <ExternalLink className="h-4 w-4 text-forest-600" aria-hidden="true" />
              Fiche publique voyageur
            </Link>

            <Link
              href={isGestionnaire ? `/gestionnaire/reservations?q=${encodeURIComponent(listing.titre)}` : `/dashboard/reservations?logementId=${listing.id}`}
              role="menuitem"
              className={item}
            >
              <Calendar className="h-4 w-4 text-forest-600" aria-hidden="true" />
              Réservations du bien
            </Link>

            {onToggleDerniereMinute && (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setOpen(false);
                    onToggleDerniereMinute(listing.id, !listing.derniereMinuteActive);
                  }}
                  className={cn(item, 'text-left')}
                >
                  <Zap className={cn('h-4 w-4 shrink-0', listing.derniereMinuteActive ? 'text-amber-500 fill-amber-400' : 'text-foreground-muted')} />
                  <span className="font-semibold text-xs">
                    {listing.derniereMinuteActive ? '⚡ Désactiver -15% Dernière Min.' : '⚡ Activer -15% Dernière Min.'}
                  </span>
                </button>
              </>
            )}

            {onToggleStatus && (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setOpen(false);
                    onToggleStatus(listing.id, listing.statut);
                  }}
                  className={cn(item, 'text-left')}
                >
                  {listing.statut === 'PUBLISHED' ? (
                    <>
                      <PauseCircle className="h-4 w-4 text-warning-600" aria-hidden="true" />
                      Mettre en pause
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 text-success-600" aria-hidden="true" />
                      Activer l&apos;annonce
                    </>
                  )}
                </button>
              </>
            )}

            {onDelete && (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setOpen(false);
                    setShowConfirmDelete(true);
                  }}
                  className={cn(item, 'text-left text-error-600 hover:bg-error-50')}
                >
                  <Trash2 className="h-4 w-4 text-error-600" aria-hidden="true" />
                  Supprimer l&apos;annonce
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression (Portail au niveau de document.body) */}
      {showConfirmDelete && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowConfirmDelete(false)}
        >
          <div
            className="w-full max-w-md rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-pill bg-error-100 flex items-center justify-center text-error-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-base font-extrabold text-foreground">
                  Supprimer l&apos;annonce ?
                </h3>
                <p className="text-xs text-foreground-muted truncate max-w-[260px]">
                  {listing.titre}
                </p>
              </div>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed">
              Cette action est définitive. L&apos;annonce et tous ses éléments associés (photos, tarifs, indisponibilités) seront définitivement retirés de la plateforme.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-pill border border-border text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDelete?.(listing.id);
                }}
                className="px-4 py-2 rounded-pill bg-error-600 hover:bg-error-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}