'use client';

/* ═══════════════════════════════════════════════════════════════════════════
   Klef — Primitives partagées des panneaux de réservation
   ───────────────────────────────────────────────────────────────────────────
   Ces briques existaient en double dans ReservationActionPanel (propriétaire)
   et TenantReservationActionPanel (locataire), avec des divergences déjà
   installées : deux barèmes de remboursement différents, deux longueurs
   minimales de motif, deux jeux de couleurs pour les mêmes états.

   Le barème vit ICI et nulle part ailleurs. C'est un engagement contractuel :
   il ne peut pas exister en trois exemplaires dans le front.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const MOTIF_MIN = 15;

/* ─── Horloge vivante ────────────────────────────────────────────────────── */

/**
 * Ces panneaux restent ouverts longtemps. Figer Date.now() au montage — ce que
 * faisaient les deux fichiers — empêche toute fenêtre temporelle de s'ouvrir :
 * le locataire planté devant la porte ne voit jamais apparaître le bouton
 * « signaler l'hôte absent », et le propriétaire ne voit jamais se débloquer
 * l'état des lieux à J−4 h. Sans rechargement manuel, rien ne bouge.
 */
export function useNow(intervalMs = 30_000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
    return now;
}

/* ─── Barème de remboursement — source unique ────────────────────────────── */

export type RefundTierId = 'full' | 'half' | 'quarter' | 'none';

export interface RefundTier {
    id: RefundTierId;
    percentage: number;
    short: string;
    window: string;
    label: string;
}

export const REFUND_TIERS: RefundTier[] = [
    { id: 'full', percentage: 100, short: '100 %', window: 'Plus de 7 jours', label: 'Remboursement intégral' },
    { id: 'half', percentage: 50, short: '50 %', window: '3 à 7 jours', label: 'Remboursement partiel' },
    { id: 'quarter', percentage: 25, short: '25 %', window: '24 h à 3 jours', label: 'Remboursement minimal' },
    { id: 'none', percentage: 0, short: '0 %', window: 'Moins de 24 h', label: 'Aucun remboursement' },
];

/** Palier applicable, en heures restantes avant le check-in. */
export function resolveRefundTier(hoursToCheckin: number): RefundTier {
    const days = hoursToCheckin / 24;
    if (days > 7) return REFUND_TIERS[0];
    if (days >= 3) return REFUND_TIERS[1];
    if (hoursToCheckin >= 24) return REFUND_TIERS[2];
    return REFUND_TIERS[3];
}

/* ─── Tonalités — classes complètes, jamais interpolées ──────────────────── */

export type Tone = 'neutral' | 'forest' | 'success' | 'warning' | 'error';

export const TONE: Record<Tone, { box: string; icon: string; title: string; body: string }> = {
    neutral: {
        box: 'bg-background-alt border-border',
        icon: 'bg-background-card border-border text-foreground-muted',
        title: 'text-foreground',
        body: 'text-foreground-muted',
    },
    forest: {
        box: 'bg-forest-50 border-forest-100',
        icon: 'bg-forest-100 border-forest-200 text-forest-700',
        title: 'text-forest-900',
        body: 'text-forest-800',
    },
    success: {
        box: 'bg-success-50 border-success-500/25',
        icon: 'bg-success-50 border-success-500/30 text-success-600',
        title: 'text-success-700',
        body: 'text-success-700',
    },
    warning: {
        box: 'bg-warning-50 border-warning-500/25',
        icon: 'bg-warning-50 border-warning-500/30 text-warning-600',
        title: 'text-warning-700',
        body: 'text-warning-700',
    },
    error: {
        box: 'bg-error-50 border-error-500/20',
        icon: 'bg-error-50 border-error-500/25 text-error-600',
        title: 'text-error-700',
        body: 'text-error-700',
    },
};

/* ─── Modale accessible ──────────────────────────────────────────────────── */

export function Modal({
    title, children, onClose, dismissible = true,
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    dismissible?: boolean;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && dismissible) { onClose(); return; }
            if (e.key !== 'Tab') return;
            const items = panelRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]',
            );
            if (!items?.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused.current?.focus();
        };
    }, [onClose, dismissible]);

    return (
        <div
            className="fixed inset-0 z-100 flex items-end justify-center bg-forest-950/70 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => dismissible && onClose()}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-card border border-border bg-background-card shadow-xl sm:max-w-lg sm:rounded-card"
            >
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-5">
                    <h2 id={titleId} className="font-display text-base font-semibold text-foreground">
                        {title}
                    </h2>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

/* ─── Retours utilisateur ────────────────────────────────────────────────── */

export function Feedback({ type, message }: { type: 'error' | 'success'; message: string }) {
    const tone = TONE[type === 'error' ? 'error' : 'success'];
    const Icon = type === 'error' ? AlertTriangle : CheckCircle2;
    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className={cn('flex items-start gap-2.5 rounded-inner border p-3.5', tone.box)}
        >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.title)} aria-hidden="true" />
            <p className={cn('text-xs leading-relaxed', tone.body)}>{message}</p>
        </div>
    );
}

export function Notice({
    tone = 'neutral', icon: Icon, title, children,
}: {
    tone?: Tone;
    icon: typeof Clock;
    title: string;
    children?: React.ReactNode;
}) {
    const t = TONE[tone];
    return (
        <div className={cn('flex items-start gap-3 rounded-inner border p-4', t.box)}>
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border', t.icon)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className={cn('text-xs font-semibold', t.title)}>{title}</p>
                {children && <div className={cn('mt-1 text-xs leading-relaxed', t.body)}>{children}</div>}
            </div>
        </div>
    );
}

/* ─── Boutons ────────────────────────────────────────────────────────────── */

export function PrimaryButton({
    onClick, disabled, loading, loadingLabel = 'Chargement…', icon: Icon, children,
}: {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    icon?: typeof CheckCircle2;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-pill bg-action py-3.5 text-sm font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] duration-200 hover:bg-action-hover hover:shadow-action-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-background-alt disabled:text-foreground-muted disabled:shadow-none"
        >
            {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{loadingLabel}</>
            ) : (
                <>{Icon && <Icon className="h-4 w-4" aria-hidden="true" />}{children}</>
            )}
        </button>
    );
}

export function GhostButton({
    onClick, disabled, children, className,
}: {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-pill border border-neutral-300 bg-background-alt px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-forest-600/40 hover:bg-background-card hover:shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function SecondaryButton({
    onClick, disabled, children, className,
}: {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-pill border border-forest-600/20 bg-forest-50 px-4.5 py-3 text-xs font-semibold text-forest-800 shadow-2xs transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-forest-600/40 hover:bg-forest-100 hover:shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function DangerButton({
    onClick, disabled, loading, loadingLabel = 'En cours…', icon: Icon, children, className,
}: {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    icon?: typeof X;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-pill bg-error-600 px-4 py-2.5 text-xs font-semibold text-neutral-0 transition-colors hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-background-alt disabled:text-foreground-faint',
                className,
            )}
        >
            {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />{loadingLabel}</>
            ) : (
                <>{Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}{children}</>
            )}
        </button>
    );
}

/* ─── Barème affiché ─────────────────────────────────────────────────────── */

export function RefundScale({ current }: { current: RefundTierId }) {
    return (
        <ul className="divide-y divide-border overflow-hidden rounded-inner border border-border">
            {REFUND_TIERS.map((t) => {
                const active = t.id === current;
                return (
                    <li
                        key={t.id}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                            'flex items-center justify-between gap-3 px-4 py-3',
                            active ? 'bg-background-alt' : 'bg-background-card',
                        )}
                    >
                        <span className="flex min-w-0 items-center gap-2.5">
                            <span
                                aria-hidden="true"
                                className={cn('h-2 w-2 shrink-0 rounded-pill', active ? 'bg-forest-600' : 'bg-border-hover')}
                            />
                            <span className={cn('truncate text-xs', active ? 'font-semibold text-foreground' : 'text-foreground-muted')}>
                                {t.window} avant l’arrivée
                            </span>
                        </span>
                        <span className={cn('shrink-0 text-xs font-semibold tabular-nums', active ? 'text-foreground' : 'text-foreground-muted')}>
                            {t.short}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

/* ─── Notation par étoiles ───────────────────────────────────────────────── */

const LIBELLES = ['Très insatisfait', 'Insatisfait', 'Correct', 'Satisfait', 'Excellent'];

export function StarRating({
    value, onChange, label,
}: {
    value: number;
    onChange: (v: number) => void;
    label: string;
}) {
    const [hover, setHover] = useState(0);

    return (
        <div className="space-y-2">
            <div
                role="radiogroup"
                aria-label={label}
                onMouseLeave={() => setHover(0)}
                className="flex items-center justify-center gap-2 rounded-inner border border-border bg-background-card py-4"
            >
                {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hover || value) >= star;
                    return (
                        <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={value === star}
                            aria-label={`${star} étoile${star > 1 ? 's' : ''} — ${LIBELLES[star - 1]}`}
                            onClick={() => onChange(star)}
                            onMouseEnter={() => setHover(star)}
                            onFocus={() => setHover(star)}
                            onBlur={() => setHover(0)}
                            className="rounded-pill transition-transform duration-150 hover:scale-110 active:scale-95"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className={cn(
                                    'h-8 w-8 transition-colors duration-150',
                                    active ? 'fill-gold-400 text-gold-400' : 'fill-none text-border-hover',
                                )}
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </button>
                    );
                })}
            </div>

            {value > 0 && (
                <p aria-live="polite" className="text-center text-xs font-semibold text-foreground">
                    {LIBELLES[value - 1]}
                </p>
            )}
        </div>
    );
}