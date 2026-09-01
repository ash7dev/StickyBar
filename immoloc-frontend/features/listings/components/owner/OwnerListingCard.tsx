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
const STATUT_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PUBLISHED: { label: 'Publiée', cls: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  PENDING_REVIEW: { label: 'En révision', cls: 'bg-warning-50 text-warning-700', dot: 'bg-warning-500' },
  DRAFT: { label: 'Brouillon', cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
  PAUSED: { label: 'En pause', cls: 'bg-neutral-100 text-foreground-muted', dot: 'bg-neutral-400' },
  REJECTED: { label: 'Rejetée', cls: 'bg-error-50 text-error-700', dot: 'bg-error-500' },
};

export function OwnerListingCard({ listing, viewMode = 'grid', onToggleStatus, onToggleDerniereMinute, onDelete, isGestionnaire = false }: Props) {
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

  const Status = (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold',
      cfg.cls,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot)} />
      {cfg.label}
    </span>
  );

  const Price = (
    <p className="flex items-baseline gap-1">
      <span className="text-base font-semibold tabular-nums text-forest-900">{price}</span>
      <span className="text-xs text-foreground-muted">FCFA / nuit</span>
    </p>
  );

  /* ── Mode liste ─────────────────────────────────────────────────────── */
  if (viewMode === 'list') {
    return (
      <article className={cn(
        "group relative flex flex-col gap-4 rounded-card border border-border bg-background-card p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-600/30 hover:shadow-md sm:flex-row sm:items-center",
        menuOpen ? "z-[60]" : "z-0 hover:z-20"
      )}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Thumb photo={photo} className="h-24 w-24 shrink-0 sm:h-28 sm:w-28" />

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {Status}
              {listing.derniereMinuteActive && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-amber-400/20 border border-amber-500/30 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-700">
                  <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                  -15% Dernière Min.
                </span>
              )}
              {listing.typeLogement && (
                <span className="text-xs font-semibold text-foreground-faint">{listing.typeLogement}</span>
              )}
            </div>

            <h3 className="font-display text-lg font-semibold leading-snug tracking-[-0.015em] text-forest-900">
              <Link
                href={detailHref}
                className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none"
              >
                {listing.titre}
              </Link>
            </h3>

            <p className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground-faint" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </span>
              {isGestionnaire && (listing as any).proprietaire && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-forest-50 border border-forest-200/60 px-2 py-0.5 text-[0.6875rem] font-semibold text-forest-700">
                  <User className="h-3 w-3" /> Bailleur : {(listing as any).proprietaire.prenom} {(listing as any).proprietaire.nom}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
          {Price}
          <div className="relative z-20 flex items-center gap-2">
            <Link
              href={editHref}
              className="inline-flex items-center gap-1.5 rounded-pill bg-action hover:bg-action-hover text-on-action px-3.5 py-2 text-xs font-semibold transition-all shadow-xs active:scale-95 border-none"
            >
              <Edit3 className="h-3.5 w-3.5 text-forest-950 stroke-[2px]" aria-hidden="true" />
              Modifier
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
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-card bg-neutral-100">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-neutral-300">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </span>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1 z-20">
          <span className="glass !rounded-pill !shadow-none">
            <span className={cn('inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold', cfg.cls)}>
              <span className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot)} />
              {cfg.label}
            </span>
          </span>
          {listing.derniereMinuteActive && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-amber-500 text-slate-950 px-2.5 py-0.5 text-[0.65rem] font-black shadow-sm">
              <Zap className="h-3 w-3 fill-slate-950" />
              -15% Dernière Min.
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 z-30">
          <ActionsMenu listing={listing} onToggleStatus={onToggleStatus} onToggleDerniereMinute={onToggleDerniereMinute} onDelete={onDelete} onPhoto onOpenChange={setMenuOpen} isGestionnaire={isGestionnaire} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground-faint" aria-hidden="true" />
          <span className="truncate">{location}</span>
        </p>

        <h3 className="mt-1 font-display text-base font-semibold leading-snug tracking-[-0.015em] text-forest-900">
          <Link
            href={detailHref}
            className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {listing.titre}
          </Link>
        </h3>

        {isGestionnaire && (listing as any).proprietaire && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-forest-700 font-semibold truncate">
            <User className="h-3.5 w-3.5 text-forest-600 shrink-0" />
            <span className="truncate">Bailleur : {(listing as any).proprietaire.prenom} {(listing as any).proprietaire.nom}</span>
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          {Price}
          {listing.typeLogement && (
            <span className="shrink-0 rounded-pill bg-neutral-100 px-2.5 py-1 text-[0.6875rem] text-foreground-muted">
              {listing.typeLogement}
            </span>
          )}
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