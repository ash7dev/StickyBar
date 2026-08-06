'use client';

import Image from 'next/image';
import { Phone, Lock, PhoneCall, ShieldCheck } from 'lucide-react';
import { canSeeCoordonnees } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Proprietaire = ReservationDetail['proprietaire'];

/** Statuts pour lesquels le numéro ne sera jamais accessible. */
const STATUTS_CLOS = ['CANCELLED', 'COMPLETED', 'EXPIRED', 'DISPUTED'];

interface Props {
  proprietaire: Proprietaire;
  statut: string;
  dateDebut: string;
}

export function TenantHostCard({ proprietaire, statut, dateDebut }: Props) {
  const canSeePhone = canSeeCoordonnees(statut, dateDebut);

  /* `prenom[0]` sur une chaîne vide vaut undefined → « undefinedundefined ». */
  const initiales =
    `${proprietaire.prenom?.[0] ?? ''}${proprietaire.nom?.[0] ?? ''}`.toUpperCase() || '?';

  const nomComplet =
    [proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ') || 'Votre hôte';

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">

      {/* ── Identité ─────────────────────────────────────────────────────── */}

      <div className="flex items-center gap-3.5">
        {/* `Image fill` exige un parent positionné : le `relative` était sur
            le wrapper externe, donc l'image se dimensionnait sur lui. */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-inner border border-border bg-forest-800 font-display text-base font-semibold text-neutral-50">
          {proprietaire.avatarUrl ? (
            <Image
              src={proprietaire.avatarUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : initiales}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Votre hôte
          </p>
          <h3 className="truncate font-display text-base font-semibold leading-tight text-foreground">
            {nomComplet}
          </h3>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-700">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Hôte vérifié
          </span>
        </div>
      </div>

      {/* ── Contact ──────────────────────────────────────────────────────── */}

      {canSeePhone && proprietaire.telephone ? (
        <a
          href={`tel:${proprietaire.telephone.replace(/[\s.\-()]/g, '')}`}
          className="group flex w-full items-center gap-3.5 rounded-inner border border-border bg-background-alt p-3.5 transition-colors hover:border-border-hover hover:bg-background-card"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Appeler l’hôte
            </span>
            <span className="block text-sm font-semibold tabular-nums text-foreground">
              {proprietaire.telephone}
            </span>
          </span>
        </a>
      ) : (
        <div className="flex items-center gap-3.5 rounded-inner border border-border bg-background-alt p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-border bg-background-card">
            <Lock className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">Numéro masqué</p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
              {STATUTS_CLOS.includes(statut)
                ? 'Non disponible pour cette réservation'
                : 'Visible 24 h avant votre arrivée'}
            </p>
          </div>
          <Phone className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}