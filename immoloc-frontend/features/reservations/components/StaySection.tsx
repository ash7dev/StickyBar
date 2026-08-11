'use client';

import { useEffect, useRef } from 'react';
import { CalendarDays, Users, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils/cn';
import { AvailabilityCalendar } from '@/features/listings/components/web/AvailabilityCalendar';
import { SectionCard, Stepper, Alerte, Montant } from './primitives';
import { fmtDate, pluriel } from '@/features/reservations/lib/reservation';
import type { ReservationState } from '@/features/reservations/hooks/use-reservation';

export function StaySection({
    r,
    ouvrirCalendrier,
}: {
    r: ReservationState;
    ouvrirCalendrier: () => void;
}) {
    const { nights, nbPersonnes, capaciteMax, personnesBase, pricing } = r;

    return (
        <div className="space-y-4">
            {/* ── Dates ────────────────────────────────────────────────────────── */}
            <SectionCard
                title="Votre séjour"
                icon={CalendarDays}
                aside={
                    nights > 0 ? (
                        <span className="rounded-pill bg-forest-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-forest-700">
                            {nights} {pluriel(nights, 'nuit')}
                        </span>
                    ) : null
                }
            >
                {/*
          Une seule cible tactile pour la plage entière. Deux boutons distincts
          « début » / « fin » ouvrant le même calendrier donnaient deux fois le
          même écran — c'est une plage qu'on choisit, pas deux dates.
        */}
                <button
                    type="button"
                    onClick={ouvrirCalendrier}
                    className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-inner border border-border bg-background-alt p-4 text-left transition-colors hover:border-border-hover"
                >
                    <span className="min-w-0">
                        <span className="eyebrow block text-[0.6875rem]">Arrivée</span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
                            {r.dateDebut ? fmtDate(r.dateDebut) : 'À choisir'}
                        </span>
                    </span>

                    <span aria-hidden className="h-8 w-px bg-border" />

                    <span className="min-w-0">
                        <span className="eyebrow block text-[0.6875rem]">Départ</span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
                            {r.dateFin ? fmtDate(r.dateFin) : 'À choisir'}
                        </span>
                    </span>
                </button>

                {r.erreurs.dates && nights > 0 && (
                    <div className="pt-3">
                        <Alerte>{r.erreurs.dates}</Alerte>
                    </div>
                )}
            </SectionCard>

            {/* ── Voyageurs ────────────────────────────────────────────────────── */}
            <SectionCard title="Voyageurs" icon={Users}>
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            {nbPersonnes} {pluriel(nbPersonnes, 'voyageur')}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-muted">
                            {capaciteMax} au maximum
                            {personnesBase ? ` · ${personnesBase} inclus dans le tarif` : ''}
                        </p>
                    </div>

                    <Stepper
                        value={nbPersonnes}
                        max={capaciteMax}
                        onChange={r.ajusterPersonnes}
                        label="voyageur"
                    />
                </div>

                {/*
          Le supplément ne s'annonce que lorsqu'il existe et qu'il est chiffré.
          Un encadré permanent « aucun supplément pour votre sélection » occupe
          la place d'une information qui n'en est pas une.
        */}
                {pricing.supplement > 0 && (
                    <p className="mt-4 border-t border-border pt-3 text-xs text-foreground-muted">
                        Au-delà de {personnesBase} {pluriel(personnesBase ?? 1, 'voyageur')}, le séjour passe à{' '}
                        <span className="font-semibold text-foreground">
                            <Montant value={pricing.total} pending={pricing.estEstimation} />
                        </span>
                        .
                    </p>
                )}
            </SectionCard>
        </div>
    );
}

/* ── Feuille calendrier ───────────────────────────────────────────────────── */

export function DateSheet({
    open,
    onClose,
    minNights,
    onRangeChange,
    nights,
}: {
    open: boolean;
    onClose: () => void;
    minNights: number;
    onRangeChange: (r: DateRange | undefined) => void;
    nights: number;
}) {
    const panelRef = useRef<HTMLDivElement>(null);

    // Échap ferme, le corps ne défile plus derrière, le focus entre dans la
    // feuille. Sans ça, sur iOS, la page continue de scroller sous la modale.
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        panelRef.current?.focus();

        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Choisir les dates du séjour"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    'w-full max-w-lg space-y-4 border border-border bg-background-card p-5 shadow-xl',
                    'rounded-t-[20px] pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-card sm:pb-5',
                    'max-h-[88vh] overflow-y-auto focus-visible:outline-none',
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-base font-semibold text-foreground">
                        Choisir vos dates
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-pill border border-border text-foreground transition-colors hover:bg-background-alt"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>
                </div>

                <AvailabilityCalendar compact minNights={minNights} onRangeChange={onRangeChange} />

                <button
                    type="button"
                    onClick={onClose}
                    disabled={nights <= 0}
                    className="btn-primary w-full disabled:opacity-40"
                >
                    {nights > 0 ? `Valider ${nights} ${pluriel(nights, 'nuit')}` : 'Choisir une plage'}
                </button>
            </div>
        </div>
    );
}