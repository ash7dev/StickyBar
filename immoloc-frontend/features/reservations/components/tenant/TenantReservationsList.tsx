'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar, MapPin, Users, ChevronRight, Clock, CheckCircle2,
  XCircle, AlertCircle, Building2, ArrowRight, ShieldCheck, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TenantReservation } from '@/features/reservations/components/tenant-reservation-card';

/* ⚠️ Corrigé : `warning-200` et `error-200` n'existent pas dans la palette
   (warning et error s'arrêtent à 50/500/600/700). Les badges PENDING,
   CANCELLED et DISPUTED s'affichaient sans bordure. */
const STATUS_CFG: Record<string, {
  label: string;
  badge: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  PENDING: { label: 'En attente', badge: 'border-amber-200 bg-amber-50 text-amber-800 font-semibold', Icon: Clock },
  PAID: { label: 'Sous séquestre', badge: 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold', Icon: ShieldCheck },
  CONFIRMED: { label: 'Confirmée', badge: 'border-blue-200 bg-blue-50 text-blue-800 font-semibold', Icon: CheckCircle2 },
  CHECKED_IN: { label: 'Séjour en cours', badge: 'border-emerald-300 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-400/30 font-bold', Icon: Sparkles },
  COMPLETED: { label: 'Terminée', badge: 'border-slate-200 bg-slate-100 text-slate-700 font-medium', Icon: CheckCircle2 },
  CANCELLED: { label: 'Annulée', badge: 'border-rose-200 bg-rose-50 text-rose-700 font-medium', Icon: XCircle },
  DISPUTED: { label: 'Litige', badge: 'border-error-300 bg-error-100 text-error-800 font-bold', Icon: AlertCircle },
  EXPIRED: { label: 'Expirée', badge: 'border-neutral-200 bg-neutral-100 text-neutral-500 font-medium', Icon: Clock },
};

const formatShort = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

const fcfa = (n: number | string) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

/** Nuits en dates civiles : la soustraction de timestamps dérivait selon le fuseau. */
function countNights(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000,
  );
}

export function TenantReservationCardItem({ reservation }: { reservation: TenantReservation }) {
  const cfg = STATUS_CFG[reservation.statut] ?? STATUS_CFG.PENDING;
  const { Icon } = cfg;

  const photo =
    reservation.logement?.photos.find((p) => p.estPrincipale) ?? reservation.logement?.photos[0];
  const type = reservation.logement?.type || 'Logement';
  const nbNuits = reservation.nbNuits ?? countNights(reservation.dateDebut, reservation.dateFin);
  const lieu = [reservation.logement?.ville, reservation.logement?.quartier]
    .filter(Boolean).join(', ');

  return (
    <Link
      href={`/reservations/${reservation.id}`}
      className="group block overflow-hidden rounded-card border border-border bg-background-card shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-border-hover hover:shadow-md"
    >
      <article className="flex flex-col sm:flex-row">

        {/* ── Photo ────────────────────────────────────────────────────── */}

        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-background-alt sm:aspect-auto sm:w-56">
          {photo ? (
            <Image
              src={photo.url}
              alt=""
              fill
              sizes="(min-width: 640px) 224px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground-muted">
              <Building2 className="h-8 w-8" aria-hidden="true" />
            </div>
          )}

          <span className="glass-dark absolute top-2.5 left-2.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold">
            {type}
          </span>
        </div>

        {/* ── Contenu ──────────────────────────────────────────────────── */}

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-semibold',
              cfg.badge,
            )}>
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {cfg.label}
            </span>
            <span className="text-xs tabular-nums text-foreground-muted">
              RÉF #{reservation.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold leading-snug text-foreground transition-colors line-clamp-2 group-hover:text-forest-700 sm:text-lg sm:truncate">
              {reservation.logement?.titre}
            </h3>
            {lieu && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{lieu}</span>
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="font-semibold text-foreground">
                <time dateTime={reservation.dateDebut.slice(0, 10)}>
                  {formatShort(reservation.dateDebut)}
                </time>
                {' → '}
                <time dateTime={reservation.dateFin.slice(0, 10)}>
                  {formatShort(reservation.dateFin)}
                </time>
              </span>
              <span className="tabular-nums">
                ({nbNuits} nuit{nbNuits > 1 ? 's' : ''})
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{reservation.nbPersonnes}</span>{' '}
              voyageur{reservation.nbPersonnes > 1 ? 's' : ''}
            </span>
          </div>

          {/* Montant */}
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-foreground-muted">
                Total sous séquestre
              </p>
              <p className="font-display text-lg font-semibold leading-none tabular-nums text-foreground">
                {fcfa(reservation.totalLocataire)}
                <span className="ml-1 font-sans text-xs font-semibold text-foreground-muted">
                  FCFA
                </span>
              </p>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-link">
              Voir le séjour
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function TenantReservationsEmptyState({ filtered }: { filtered?: boolean }) {
  return (
    <div className="mx-auto my-8 max-w-md space-y-4 rounded-card border border-border bg-background-card p-12 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
        <Calendar className="h-7 w-7" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {filtered ? 'Aucun séjour trouvé' : 'Aucune réservation pour le moment'}
        </h3>
        <p className="text-xs leading-relaxed text-foreground-muted">
          {filtered
            ? 'Aucune réservation ne correspond à ce filtre.'
            : 'Explorez les logements vérifiés et préparez votre prochain séjour.'}
        </p>
      </div>

      {!filtered && (
        /* ★ Seul aplat lime : la conversion, sur un écran vide. */
        <Link
          href="/explorer"
          className="mt-2 inline-flex items-center gap-2 rounded-pill bg-action px-6 py-3 text-sm font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98]"
        >
          Parcourir les logements
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}