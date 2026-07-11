'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Reservation {
  id: string;
  dateDebut: string;
  dateFin: string;
  nbNuits?: number;
  totalLocataire: number;
  statut: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'PAID' | 'EXPIRED';
  locataire: { prenom: string; nom: string; avatarUrl?: string | null };
  logement: { id: string; titre: string; ville: string; photos: Array<{ url: string; estPrincipale: boolean }> };
  creeLe: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Config
   ═══════════════════════════════════════════════════════════════════════════ */

const STATUT_CONFIG: Record<string, { label: string; theme: 'neutral' | 'emerald' | 'success' | 'warning' | 'error' }> = {
  COMPLETED:  { label: 'Terminée',   theme: 'neutral'  },
  CHECKED_IN: { label: 'En cours',   theme: 'success'  },
  CONFIRMED:  { label: 'Confirmée',  theme: 'emerald'  },
  PENDING:    { label: 'En attente', theme: 'warning'  },
  CANCELLED:  { label: 'Annulée',    theme: 'error'    },
  DISPUTED:   { label: 'Litige',     theme: 'error'    },
  PAID:       { label: 'Payée',      theme: 'success'  },
  EXPIRED:    { label: 'Expirée',    theme: 'neutral'  },
};

/* Thèmes basés uniquement sur les tokens ImmoLoc.
   success / warning / error n'exposent que 500 & 600 → fonds doux via opacité. */
const THEMES = {
  neutral: {
    bg: 'bg-background-alt', text: 'text-foreground-muted', dot: 'bg-neutral-400',
    border: 'border-border', avatar: 'bg-background-alt text-foreground', bar: 'bg-neutral-400',
  },
  emerald: {
    bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500',
    border: 'border-emerald-100', avatar: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500',
  },
  success: {
    bg: 'bg-success-500/10', text: 'text-success-600', dot: 'bg-success-500',
    border: 'border-success-500/20', avatar: 'bg-success-500/15 text-success-600', bar: 'bg-success-500',
  },
  warning: {
    bg: 'bg-warning-500/10', text: 'text-warning-600', dot: 'bg-warning-500',
    border: 'border-warning-500/20', avatar: 'bg-warning-500/15 text-warning-600', bar: 'bg-warning-500',
  },
  error: {
    bg: 'bg-error-500/10', text: 'text-error-600', dot: 'bg-error-500',
    border: 'border-error-500/20', avatar: 'bg-error-500/15 text-error-600', bar: 'bg-error-500',
  },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

const fmt     = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/* ═══════════════════════════════════════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════════════════════════════════════ */

export function ReservationCardSkeleton() {
  return (
    <div className="bg-background-card rounded-2xl border border-border animate-pulse overflow-hidden">
      {/* Mobile */}
      <div className="md:hidden flex gap-3 p-3">
        <div className="w-20 h-20 rounded-xl bg-background-alt shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-16 bg-background-alt rounded-full" />
          <div className="h-4 w-3/4 bg-background-alt rounded-lg" />
          <div className="h-3 w-1/2 bg-background-alt rounded" />
          <div className="h-3 w-2/3 bg-background-alt rounded" />
        </div>
      </div>
      <div className="md:hidden h-14 bg-background-alt" />
      {/* Desktop */}
      <div className="hidden md:flex gap-5 p-5">
        <div className="w-40 h-40 rounded-xl bg-background-alt shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 w-3/4 bg-background-alt rounded-lg" />
          <div className="h-4 w-1/2 bg-background-alt rounded" />
          <div className="h-10 w-full bg-background-alt rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card Item
   ═══════════════════════════════════════════════════════════════════════════ */

export function ReservationCardItem({ reservation }: { reservation: Reservation }) {
  const principalPhoto = reservation.logement.photos.find((p) => p.estPrincipale) ?? reservation.logement.photos[0];
  const cfg      = STATUT_CONFIG[reservation.statut] ?? { label: reservation.statut, theme: 'neutral' as const };
  const theme    = THEMES[cfg.theme];
  const initials = `${reservation.locataire.prenom.charAt(0)}${reservation.locataire.nom.charAt(0)}`.toUpperCase();
  const isPending = reservation.statut === 'PENDING';

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
         MOBILE (< md)
         ══════════════════════════════════════════════════════════ */}
      <div className={`md:hidden bg-background-card rounded-2xl border overflow-hidden shadow-md active:scale-[0.985] transition-transform duration-200 ${isPending ? 'border-warning-500/30' : 'border-border'}`}>

        {/* Bandeau d'action pour PENDING */}
        {isPending && <div className="h-1 w-full bg-warning-500" />}

        <div className="flex gap-3 p-3">
          <Link href={`/dashboard/reservations/${reservation.id}`} className="shrink-0">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-background-alt">
              {principalPhoto ? (
                <Image src={principalPhoto.url} alt={reservation.logement.titre} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-neutral-300" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0 py-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border mb-1.5 ${theme.bg} ${theme.text} ${theme.border}`}>
              <span className={`w-1 h-1 rounded-full ${theme.dot}`} />
              {cfg.label}
            </span>

            <p className="font-display text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-1.5">
              {reservation.logement.titre}
            </p>

            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${theme.avatar}`}>
                {initials}
              </div>
              <span className="text-xs font-semibold text-foreground-muted truncate">
                {reservation.locataire.prenom} {reservation.locataire.nom.charAt(0)}.
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
              <span className="text-[11px] text-foreground-muted font-medium">
                {fmtDate(reservation.dateDebut)} — {fmtDate(reservation.dateFin)}
                {reservation.nbNuits ? ` · ${reservation.nbNuits} nuit${reservation.nbNuits > 1 ? 's' : ''}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Barre prix — Vert Forêt profond (signature) */}
        <Link href={`/dashboard/reservations/${reservation.id}`} className="block relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-900" />
          {/* halo forêt subtil */}
          <div className={`absolute -top-10 -left-6 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-40 ${isPending ? 'bg-warning-500' : 'bg-emerald-500'}`} />
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

          <div className="relative flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-white/45">
                Total séjour
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-2xl font-bold text-white tracking-tight leading-none tabular-nums">
                  {fmt(reservation.totalLocataire)}
                </span>
                <span className="text-[10px] font-bold text-white/40">FCFA</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPending && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[10px] font-black text-emerald-700 shadow-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Confirmer
                </span>
              )}
              <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-white/10 border-white/15 text-white/80">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════
         DESKTOP (≥ md)
         ══════════════════════════════════════════════════════════ */}
      <div className={`hidden md:flex bg-background-card rounded-2xl border p-5 gap-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 group relative overflow-hidden ${isPending ? 'border-warning-500/30' : 'border-border'}`}>

        {/* Barre d'accent gauche selon statut */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${theme.bar}`} />

        <Link href={`/dashboard/reservations/${reservation.id}`} className="block shrink-0 ml-2">
          <div className="w-40 h-40 rounded-xl overflow-hidden relative bg-background-alt group-hover:ring-2 ring-emerald-500/20 transition-all">
            {principalPhoto ? (
              <Image
                src={principalPhoto.url}
                alt={reservation.logement.titre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="160px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-neutral-300" />
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Réf + ville / titre + statut */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1.5">
                <span className="px-2 py-0.5 rounded border bg-background-alt border-border font-mono">
                  #{reservation.id.slice(0, 8).toUpperCase()}
                </span>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{reservation.logement.ville}</span>
              </div>
              <Link href={`/dashboard/reservations/${reservation.id}`} className="block">
                <h3 className="font-display text-[17px] font-semibold text-foreground line-clamp-1 group-hover:text-emerald-600 transition-colors">
                  {reservation.logement.titre}
                </h3>
              </Link>
            </div>

            <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-foreground-muted uppercase tracking-wider">Séjour</p>
                <p className="text-xs font-bold text-foreground">
                  {fmtDate(reservation.dateDebut)} — {fmtDate(reservation.dateFin)}
                  {reservation.nbNuits ? (
                    <span className="text-foreground-muted font-medium ml-1">· {reservation.nbNuits} nuit{reservation.nbNuits > 1 ? 's' : ''}</span>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${theme.avatar}`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-foreground-muted uppercase tracking-wider">Locataire</p>
                <p className="text-xs font-bold text-foreground truncate">
                  {reservation.locataire.prenom} {reservation.locataire.nom}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mb-0.5">Total séjour</p>
              <div className="flex items-baseline gap-1">
                <span className="font-sans text-xl font-bold text-foreground tracking-tight tabular-nums">
                  {fmt(reservation.totalLocataire)}
                </span>
                <span className="text-[10px] font-bold text-foreground-muted uppercase">FCFA</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPending && (
                <>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-error-600 bg-error-500/10 hover:bg-error-500/20 border border-error-500/20 rounded-lg transition-colors">
                    <XCircle className="w-3.5 h-3.5" />
                    Refuser
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/25 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmer
                  </button>
                </>
              )}

              <Link
                href={`/dashboard/reservations/${reservation.id}`}
                className="w-9 h-9 rounded-full bg-background-alt flex items-center justify-center border border-border hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-colors text-foreground-muted ml-1"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
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

export function ReservationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-background-alt border border-border flex items-center justify-center mb-5 shadow-sm">
        <Calendar className="w-7 h-7 text-neutral-300" />
      </div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-1.5">
        Aucune réservation trouvée
      </h2>
      <p className="text-sm text-foreground-muted max-w-xs leading-relaxed">
        Aucune réservation ne correspond à ces critères pour le moment.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Error State
   ═══════════════════════════════════════════════════════════════════════════ */

export function ReservationsErrorState() {
  return (
    <div className="flex items-start gap-3 bg-error-500/10 border border-error-500/20 rounded-2xl p-4">
      <span className="w-2 h-2 rounded-full bg-error-500 mt-1.5 shrink-0" />
      <p className="text-sm text-error-600 font-medium">
        Impossible de charger les réservations. Rafraîchissez la page pour réessayer.
      </p>
    </div>
  );
}