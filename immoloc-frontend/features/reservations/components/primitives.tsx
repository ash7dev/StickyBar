'use client';

import type { ComponentType, ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fmtMontant } from '@/features/reservations/lib/reservation';

// Rappel de discipline pour tout ce fichier :
// · graisse plafonnée à 600 → font-semibold, jamais font-bold/extrabold
// · deux rayons de premier plan → rounded-card (conteneur), rounded-pill
//   (interactif) ; rounded-inner uniquement À L'INTÉRIEUR d'une carte
// · le lime ne porte pas de texte : il remplit le bouton de conversion,
//   colore une icône, marque une bordure. Rien d'autre.

/* ── Carte de section ─────────────────────────────────────────────────────── */

export function SectionCard({
    title,
    icon: Icon,
    aside,
    children,
    className,
}: {
    title?: string;
    icon?: ComponentType<{ className?: string }>;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('card p-5 lg:p-6', className)}>
            {(title || aside) && (
                <header className="flex items-center justify-between gap-3 pb-4">
                    {title && (
                        <h2 className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal text-foreground">
                            {Icon && <Icon className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />}
                            {title}
                        </h2>
                    )}
                    {aside}
                </header>
            )}
            {children}
        </section>
    );
}

/* ── Montants ─────────────────────────────────────────────────────────────── */

/**
 * Un montant, jamais un nombre nu. `pending` affiche un fantôme plutôt qu'un
 * chiffre provisoire : montrer un total qui change sous les yeux du locataire
 * pendant qu'il lit coûte plus de confiance qu'une demi-seconde d'attente.
 */
export function Montant({
    value,
    pending,
    className,
    suffix = ' FCFA',
}: {
    value: unknown;
    pending?: boolean;
    className?: string;
    suffix?: string;
}) {
    if (pending) return <Skeleton className={cn('h-[1em] w-20 align-middle', className)} />;
    return (
        <span className={cn('tabular-nums', className)}>
            {fmtMontant(value)}
            {suffix}
        </span>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={cn('inline-block animate-pulse rounded-pill bg-background-alt', className)}
        />
    );
}

/** Ligne libellé / montant d'un récapitulatif. */
export function LigneMontant({
    label,
    value,
    pending,
    strong,
    inverse,
}: {
    label: ReactNode;
    value: unknown;
    pending?: boolean;
    strong?: boolean;
    inverse?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className={cn(inverse ? 'text-on-inverse-muted' : 'text-foreground-muted')}>
                {label}
            </span>
            <Montant
                value={value}
                pending={pending}
                className={cn(
                    strong ? 'font-semibold' : 'font-medium',
                    inverse ? 'text-on-inverse' : 'text-foreground',
                )}
            />
        </div>
    );
}

/* ── Stepper ──────────────────────────────────────────────────────────────── */

export function Stepper({
    value,
    min = 1,
    max,
    onChange,
    label,
}: {
    value: number;
    min?: number;
    max: number;
    onChange: (delta: number) => void;
    label: string;
}) {
    const boutonClass =
        'flex h-10 w-10 items-center justify-center rounded-pill border border-border bg-background-card text-foreground transition-colors hover:border-border-hover hover:bg-background-alt disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => onChange(-1)}
                disabled={value <= min}
                className={boutonClass}
                aria-label={`Retirer un ${label}`}
            >
                <Minus className="h-4 w-4" aria-hidden />
            </button>

            <span
                className="w-9 text-center text-base font-semibold tabular-nums text-foreground"
                aria-live="polite"
            >
                {value}
            </span>

            <button
                type="button"
                onClick={() => onChange(1)}
                disabled={value >= max}
                className={boutonClass}
                aria-label={`Ajouter un ${label}`}
            >
                <Plus className="h-4 w-4" aria-hidden />
            </button>
        </div>
    );
}

/* ── Option sélectionnable (radio déguisé) ────────────────────────────────── */

/**
 * L'état sélectionné se lit à la bordure forest et au disque plein, pas à un
 * fond sombre : inverser la surface d'une option la fait passer pour un bouton
 * d'action, et l'écran se met à avoir deux CTA.
 */
export function OptionCard({
    selected,
    onSelect,
    children,
    className,
    name,
}: {
    selected: boolean;
    onSelect: () => void;
    children: ReactNode;
    className?: string;
    name: string;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            name={name}
            onClick={onSelect}
            className={cn(
                'relative w-full rounded-inner border p-4 text-left transition-colors',
                selected
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-border bg-background-card hover:border-border-hover hover:bg-background-alt',
                className,
            )}
        >
            {children}
            <span
                aria-hidden
                className={cn(
                    'absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-pill border transition-colors',
                    selected ? 'border-forest-600 bg-forest-600' : 'border-border-hover bg-background-card',
                )}
            >
                {selected && <span className="h-1.5 w-1.5 rounded-pill bg-neutral-0" />}
            </span>
        </button>
    );
}

/* ── Case à cocher accessible ─────────────────────────────────────────────── */

/**
 * Vraie <input type="checkbox"> masquée visuellement : focus clavier, lecteurs
 * d'écran et soumission natifs. La version précédente posait un onClick sur un
 * <div> dans un <label> — invisible au clavier et déclenchée deux fois au clic.
 */
export function Checkbox({
    checked,
    onChange,
    children,
    id,
    invalid,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    children: ReactNode;
    id: string;
    invalid?: boolean;
}) {
    return (
        <label htmlFor={id} className="group flex cursor-pointer items-start gap-3">
            <span className="relative mt-0.5 flex shrink-0 items-center justify-center">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer absolute h-5 w-5 cursor-pointer opacity-0"
                />
                <span
                    aria-hidden
                    className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-[6px] border transition-colors',
                        'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                        checked
                            ? 'border-forest-600 bg-forest-600'
                            : invalid
                                ? 'border-error-500 bg-background-card'
                                : 'border-border-hover bg-background-card group-hover:border-forest-500',
                    )}
                >
                    {checked && (
                        <svg viewBox="0 0 12 12" className="h-3 w-3 text-neutral-0" fill="none" aria-hidden>
                            <path
                                d="M1.5 6.5 4.5 9.5 10.5 2.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </span>
            </span>
            <span className="text-xs leading-relaxed text-foreground-muted">{children}</span>
        </label>
    );
}

/* ── Message d'erreur ─────────────────────────────────────────────────────── */

export function Alerte({ children }: { children: ReactNode }) {
    return (
        <p role="alert" className="rounded-inner bg-error-50 px-3.5 py-2.5 text-xs text-error-700">
            {children}
        </p>
    );
}