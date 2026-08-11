'use client';

import Image from 'next/image';
import { MapPin, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { LigneMontant, Montant, Skeleton } from './primitives';
import { fmtPeriode, pluriel } from '@/features/reservations/lib/reservation';
import type { ReservationState } from '@/features/reservations/hooks/use-reservation';

/* ── Détail tarifaire ─────────────────────────────────────────────────────── */

export function DetailTarifaire({ r }: { r: ReservationState }) {
    const { pricing, nights, nbPersonnes, personnesBase } = r;
    const enAttente = pricing.estEstimation || r.previewLoading;

    if (nights <= 0) {
        return (
            <p className="text-sm text-foreground-muted">
                Le détail du prix s&apos;affiche dès que vos dates sont choisies.
            </p>
        );
    }

    return (
        <div className="space-y-2.5">
            <LigneMontant
                label={
                    <>
                        <Montant value={pricing.prixNuit} pending={enAttente} suffix="" /> × {nights}{' '}
                        {pluriel(nights, 'nuit')}
                    </>
                }
                value={pricing.sousTotal}
                pending={enAttente}
            />

            {pricing.supplement > 0 && (
                <LigneMontant
                    label={`Voyageurs au-delà de ${personnesBase ?? 1}`}
                    value={pricing.supplement}
                    pending={enAttente}
                />
            )}

            <div aria-hidden className="h-px bg-border" />

            <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold text-foreground">Total du séjour</span>
                <Montant
                    value={pricing.total}
                    pending={enAttente}
                    className="font-display text-lg font-semibold text-foreground"
                />
            </div>
        </div>
    );
}

/* ── Bloc montant — la seule surface sombre de l'écran ────────────────────── */

/**
 * Le montant reste NEUTRE, en Fraunces. Le lime survit ici en marqueur : la
 * seule icône du sceau. Écrire le prix en lime alors qu'un CTA lime existe
 * plus bas annulerait la distinction action / information.
 */
export function BlocMontant({ r, className }: { r: ReservationState; className?: string }) {
    const { pricing } = r;
    const enAttente = pricing.estEstimation || r.previewLoading;

    return (
        <div className={cn('section-inverse p-5', className)}>
            <p className="eyebrow text-[0.6875rem]">
                {pricing.enAcompte ? `Acompte · ${pricing.acomptePct}%` : 'À régler'}
            </p>

            <p className="mt-2 flex items-baseline gap-2.5">
                {enAttente ? (
                    <Skeleton className="h-8 w-40 bg-border-inverse-strong" />
                ) : (
                    <>
                        <Montant
                            value={pricing.aDebiter}
                            className="font-display text-[1.75rem] font-semibold leading-none text-on-inverse-display"
                        />
                        {pricing.coinsUtilises > 0 && (
                            <Montant
                                value={pricing.montantDuJour}
                                className="text-xs text-on-inverse-muted line-through"
                            />
                        )}
                    </>
                )}
            </p>

            {pricing.coinsUtilises > 0 && (
                <p className="mt-2 text-xs text-on-inverse-muted">
                    <Montant value={pricing.coinsUtilises} /> réglés en Klef Coins.
                </p>
            )}

            {pricing.enAcompte && pricing.soldeArrivee > 0 && (
                <p className="mt-2 text-xs text-on-inverse-muted">
                    Solde de <Montant value={pricing.soldeArrivee} /> à la remise des clés.
                </p>
            )}

            <p className="mt-4 flex items-start gap-2 border-t border-border-inverse pt-3.5 text-xs text-on-inverse-muted">
                <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-on-inverse-marker" aria-hidden />
                <span>Klef conserve les fonds jusqu&apos;à votre arrivée dans le logement.</span>
            </p>
        </div>
    );
}

/* ── Carte logement ───────────────────────────────────────────────────────── */

export function CarteLogement({ r }: { r: ReservationState }) {
    const { listing, listingLoading, nights, nbPersonnes } = r;
    const photo = listing?.photos?.find((p) => p.estPrincipale) ?? listing?.photos?.[0];

    return (
        <div className="space-y-4">
            <div className="relative aspect-[16/10] overflow-hidden rounded-inner bg-background-alt">
                {listingLoading ? (
                    <span className="block h-full w-full animate-pulse bg-background-alt" />
                ) : (
                    photo && (
                        <Image
                            src={photo.url}
                            alt={listing?.titre ?? ''}
                            fill
                            sizes="(min-width: 1024px) 420px, 100vw"
                            className="object-cover"
                        />
                    )
                )}
            </div>

            <div>
                <p className="eyebrow text-[0.6875rem]">{listing?.sousType || listing?.type || 'Logement'}</p>
                <h2 className="mt-1 font-display text-lg font-semibold leading-snug text-foreground">
                    {listing?.titre ?? <Skeleton className="h-5 w-48" />}
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                    <span className="truncate">
                        {listing?.ville}
                        {listing?.quartier ? `, ${listing.quartier}` : ''}
                    </span>
                </p>
            </div>

            <dl className="space-y-1.5 border-t border-border pt-4 text-xs">
                <div className="flex justify-between gap-4">
                    <dt className="text-foreground-muted">Séjour</dt>
                    <dd className="font-medium text-foreground">{fmtPeriode(r.dateDebut, r.dateFin)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-foreground-muted">Voyageurs</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                        {nbPersonnes} {pluriel(nbPersonnes, 'voyageur')}
                        {nights > 0 ? ` · ${nights} ${pluriel(nights, 'nuit')}` : ''}
                    </dd>
                </div>
            </dl>
        </div>
    );
}

/* ── Rail collant desktop ─────────────────────────────────────────────────── */

export function SummaryRail({ r, children }: { r: ReservationState; children?: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="card p-5">
                <CarteLogement r={r} />
                <div className="mt-5 border-t border-border pt-5">
                    <DetailTarifaire r={r} />
                </div>
            </div>

            <BlocMontant r={r} />

            {children}
        </div>
    );
}