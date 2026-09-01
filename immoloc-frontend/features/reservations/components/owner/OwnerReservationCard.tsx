'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, ImageOff, XCircle } from 'lucide-react';
import type { Reservation } from '@/features/reservations/components/reservation-card';
import { cn } from '@/lib/utils/cn';
import { fcfa, fmtDateShort, STATUT_CFG_LIGHT } from '@/lib/dashboard/owner-tokens';

interface Props {
  reservation: Reservation;
  viewMode?: 'grid' | 'list';
  hrefPrefix?: string;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function OwnerReservationCard({
  reservation, viewMode = 'list', hrefPrefix = '/dashboard/reservations', onConfirm, onCancel,
}: Props) {
  // Confirmer ou refuser partait au premier clic, sans retour ni verrou :
  // un double-clic envoyait deux requetes, et un clic malencontreux annulait
  // le sejour d'un voyageur sans aucun filet.
  const [busy, setBusy] = useState(false);
  const [confirmingRefusal, setConfirmingRefusal] = useState(false);

  const photos = reservation.logement?.photos ?? [];
  const mainPhoto = photos.find((p) => p.estPrincipale) ?? photos[0];
  const cfg = STATUT_CFG_LIGHT[reservation.statut] ?? STATUT_CFG_LIGHT.COMPLETED;

  const initials =
    `${reservation.locataire.prenom?.[0] ?? ''}${reservation.locataire.nom?.[0] ?? ''}`.toUpperCase() || 'L';

  const dateDeb = new Date(reservation.dateDebut);
  const dateFin = new Date(reservation.dateFin);
  const nuits = reservation.nbNuits
    ?? Math.max(1, Math.round((dateFin.getTime() - dateDeb.getTime()) / 86_400_000));

  // Le montant net propriétaire est déjà calculé dans le backend
  const hostAmount = Number(reservation.netProprietaire ?? reservation.totalLocataire ?? 0);

  const isPending = reservation.statut === 'PENDING';
  const href = `${hrefPrefix}/${reservation.id}`;

  const run = (fn?: (id: string) => void) => () => {
    if (!fn || busy) return;
    setBusy(true);
    fn(reservation.id);
  };

  const Status = (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold',
      cfg.cls,
    )}>
      {/* Le point de CHECKED_IN clignotait en boucle : autant d'animations
          infinies que de lignes dans la liste. */}
      <span className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot)} />
      {cfg.label}
    </span>
  );

  const Guest = (
    <span className="flex items-center gap-2">
      {/* L'avatar etait en forest-950 avec initiales lime : l'accent portait
          des lettres, et chaque ligne contenait un petit rectangle noir. */}
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-forest-100 text-[0.625rem] font-semibold text-forest-700">
        {initials}
      </span>
      <span className="truncate text-forest-900">
        {reservation.locataire.prenom} {reservation.locataire.nom}
      </span>
    </span>
  );

  const Dates = (
    <span className="flex items-center gap-1.5 text-foreground-muted">
      <Calendar className="h-3.5 w-3.5 shrink-0 text-foreground-faint" aria-hidden="true" />
      {fmtDateShort(reservation.dateDebut)} → {fmtDateShort(reservation.dateFin)}
      <span className="text-foreground-faint">· {nuits} nuit{nuits > 1 ? 's' : ''}</span>
    </span>
  );

  const Amount = (
    <div className="shrink-0 text-right">
      {/* Le montant vivait dans un cartouche forest-950 de 170px de large,
          chiffres en lime. Sur vingt lignes, vingt blocs noirs qui pesaient
          plus lourd que le nom du voyageur et que le statut. */}
      <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">
        Revenu hôte
      </p>
      <p className="flex items-baseline justify-end gap-1">
        <span className="text-lg font-semibold tabular-nums tracking-[-0.01em] text-forest-900">
          {fcfa(hostAmount)}
        </span>
        <span className="text-xs text-foreground-muted">FCFA</span>
      </p>
    </div>
  );

  const Actions = isPending && (onConfirm || onCancel) ? (
    <div className="relative z-20 flex items-center gap-2">
      {onCancel && (
        confirmingRefusal ? (
          // Refuser est destructif et irreversible pour le voyageur :
          // une confirmation en deux temps, sans modale.
          <span className="flex items-center gap-1.5 rounded-pill bg-error-50 px-2 py-1.5 text-xs">
            <span className="pl-1 font-medium text-error-700">Refuser ?</span>
            <button
              type="button"
              onClick={run(onCancel)}
              disabled={busy}
              className="rounded-pill bg-error-600 px-2.5 py-1 font-semibold text-white transition-colors hover:bg-error-700 disabled:opacity-50"
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRefusal(false)}
              className="rounded-pill px-2 py-1 font-medium text-error-700 transition-colors hover:bg-error-100"
            >
              Non
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingRefusal(true)}
            disabled={busy}
            className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-border px-4 text-xs font-semibold text-foreground-muted transition-colors duration-150 hover:border-error-500/30 hover:bg-error-50 hover:text-error-700 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Refuser
          </button>
        )
      )}

      {onConfirm && !confirmingRefusal && (
        // Confirmer est une action structurante : les tokens la placent sur
        // buttonPrimary = forest-600. Le lime reste au CTA de page.
        <button
          type="button"
          onClick={run(onConfirm)}
          disabled={busy}
          className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-forest-600 px-4 text-xs font-semibold text-white transition-colors duration-150 hover:bg-forest-700 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {busy ? 'Envoi…' : 'Confirmer'}
        </button>
      )}
    </div>
  ) : null;

  /* -- Mode liste --------------------------------------------------------- */
  if (viewMode === 'list') {
    return (
      <article className="group relative isolate flex flex-col gap-4 rounded-card border border-border bg-background-card p-4 shadow-xs transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none sm:flex-row sm:items-center sm:p-5">

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Thumb photo={mainPhoto?.url} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />

          <div className="min-w-0 flex-1 space-y-1.5">
            {Status}

            {/*
              La carte contenait TROIS liens vers la meme page : la photo, le
              titre et le chevron. Un lecteur d'ecran annoncait trois fois la
              meme destination. Un seul lien, etire sur toute la carte.
            */}
            <h3 className="font-display text-base font-semibold leading-snug tracking-[-0.015em] text-forest-900 sm:text-lg">
              <Link
                href={href}
                className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
              >
                {reservation.logement?.titre ?? 'Réservation'}
              </Link>
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {Guest}
              {Dates}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
          {Amount}
          {Actions}
          {!Actions && (
            <ChevronRight
              className="hidden h-5 w-5 shrink-0 text-foreground-faint transition-colors group-hover:text-forest-600 sm:block"
              aria-hidden="true"
            />
          )}
        </div>
      </article>
    );
  }

  /* -- Mode grille -------------------------------------------------------- */
  return (
    <article className="group relative isolate flex flex-col overflow-hidden rounded-card border border-border bg-background-card shadow-xs transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {mainPhoto ? (
          <Image
            src={mainPhoto.url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        ) : (
          <span className="grid h-full place-items-center text-neutral-300">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </span>
        )}

        <span className="absolute left-3 top-3 rounded-pill border border-white/60 bg-white/85 p-0.5 backdrop-blur-md">
          {Status}
        </span>
      </div>

      {/* p-4.5 n'existe pas dans Tailwind : l'echelle n'a pas de 4.5, donc
          ces deux blocs n'avaient aucun padding. */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold leading-snug tracking-[-0.015em] text-forest-900">
          <Link
            href={href}
            className="line-clamp-1 after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {reservation.logement?.titre ?? 'Réservation'}
          </Link>
        </h3>

        <div className="mt-2.5 space-y-1.5 text-xs">
          {Guest}
          {Dates}
        </div>

        <div className="mt-auto border-t border-border pt-3">
          <div className="flex items-end justify-between gap-3">
            {Amount}
            {!isPending && (
              <ChevronRight
                className="h-5 w-5 shrink-0 text-foreground-faint transition-colors group-hover:text-forest-600"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Le bouton « Détails » faisait h-12 md:h-14, soit 56px de haut,
              en forest-950 avec texte lime. Sur une grille, il pesait plus
              lourd que la photo. Le lien de la carte suffit. */}
          {Actions && <div className="mt-3 flex justify-end">{Actions}</div>}
        </div>
      </div>
    </article>
  );
}

/* -- Vignette ------------------------------------------------------------- */

function Thumb({ photo, className }: { photo?: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-inner bg-neutral-100', className)}>
      {photo ? (
        <Image src={photo} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <span className="grid h-full place-items-center text-neutral-300">
          <ImageOff className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}