'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ---------------------------------------------------------------------------
   Primitives partagées du wizard.

   SectionCard, FieldLabel, INPUT_CLS, Counter et CounterRow étaient copiés
   a l'identique dans cinq fichiers d'etapes. Le bug de padding ci-dessous
   existait donc en cinq exemplaires, et toute correction devait etre faite
   cinq fois.
   ------------------------------------------------------------------------ */

export function SectionCard({
    icon: Icon, title, description, badge, open, onToggle, children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    badge?: string;
    open?: boolean;
    onToggle?: () => void;
    children: React.ReactNode;
}) {
    const collapsible = onToggle !== undefined;
    const Header = collapsible ? 'button' : 'div';

    return (
        <section className="overflow-hidden rounded-card border border-border bg-background-card shadow-sm">
            <Header
                {...(collapsible
                    ? { type: 'button' as const, onClick: onToggle, 'aria-expanded': open }
                    : {})}
                className={cn(
                    // px-6 py-4.5 : py-4.5 n'existe pas dans l'echelle Tailwind (seuls
                    // 0.5, 1.5, 2.5 et 3.5 sont definis). L'en-tete n'avait donc AUCUN
                    // padding vertical, dans les cinq etapes du wizard.
                    'flex w-full items-center justify-between gap-3 border-b border-border bg-background-alt px-5 py-4 text-left sm:px-6',
                    collapsible && 'transition-colors duration-150 hover:bg-neutral-100',
                )}
            >
                <span className="flex min-w-0 items-center gap-3.5">
                    {/*
            Le squircle etait en forest-950 avec icone lime. Repete a chaque
            en-tete, ca donne trois a quatre blocs sombres a lime par ecran
            de formulaire. Le marker du systeme suffit : teinte lime, icone
            forest, aucun trou noir dans la page.
          */}
                    <span className="marker shrink-0">
                        <Icon className="h-[1.125rem] w-[1.125rem]" />
                    </span>
                    <span className="min-w-0">
                        <span className="block font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
                            {title}
                        </span>
                        {description && (
                            <span className="mt-0.5 block text-xs text-foreground-muted">{description}</span>
                        )}
                    </span>
                </span>

                <span className="flex shrink-0 items-center gap-2.5">
                    {badge && (
                        <span className="hidden rounded-pill bg-neutral-100 px-2.5 py-1 text-[0.6875rem] font-medium text-foreground-muted sm:block">
                            {badge}
                        </span>
                    )}
                    {collapsible && (
                        <span className="grid h-8 w-8 place-items-center rounded-pill border border-border text-foreground-muted">
                            <svg
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                                className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
                                aria-hidden="true"
                            >
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </span>
                    )}
                </span>
            </Header>

            {(!collapsible || open) && (
                <div className="space-y-6 p-5 sm:p-6">{children}</div>
            )}
        </section>
    );
}

export function FieldLabel({
    htmlFor, children, required, optional,
}: {
    htmlFor?: string;
    children: React.ReactNode;
    required?: boolean;
    optional?: boolean;
}) {
    return (
        <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-foreground">
            {children}
            {required && <span className="ml-1 text-error-600" aria-hidden="true">*</span>}
            {optional && <span className="ml-2 text-xs font-normal text-foreground-faint">optionnel</span>}
        </label>
    );
}

export const INPUT_CLS =
    'w-full rounded-field border border-border bg-background-card px-4 py-3 text-[0.9375rem] text-foreground ' +
    'placeholder:text-foreground-faint outline-none transition-[border-color,box-shadow] duration-150 ' +
    'focus:border-forest-500 focus:ring-2 focus:ring-forest-500/25';

export const INPUT_ERR =
    'w-full rounded-field border border-error-500 bg-background-card px-4 py-3 text-[0.9375rem] text-foreground ' +
    'placeholder:text-foreground-faint outline-none transition-[border-color,box-shadow] duration-150 ' +
    'focus:border-error-500 focus:ring-2 focus:ring-error-500/25';

export const inputCls = (hasError?: boolean) => (hasError ? INPUT_ERR : INPUT_CLS);

export function FieldError({ id, children }: { id?: string; children?: string }) {
    if (!children) return null;
    return (
        <p id={id} role="alert" className="mt-1.5 text-xs text-error-600">
            {children}
        </p>
    );
}

/* -- Compteur -------------------------------------------------------------- */

export function Counter({
    value, onChange, min = 0, max = 30, label,
}: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    label: string;
}) {
    const btn =
        'grid h-9 w-9 place-items-center rounded-pill border border-border bg-background-card text-foreground-muted ' +
        'transition-colors duration-150 hover:border-forest-500 hover:text-forest-700 ' +
        'disabled:pointer-events-none disabled:opacity-30';

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                aria-label={`Diminuer : ${label}`}
                className={btn}
            >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {/* aria-live : sans lui, un lecteur d'ecran n'annonce rien quand la
          valeur change au clic. */}
            <span
                aria-live="polite"
                className="w-9 text-center text-base font-semibold tabular-nums text-forest-900"
            >
                {value}
            </span>

            <button
                type="button"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                aria-label={`Augmenter : ${label}`}
                className={btn}
            >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
        </div>
    );
}

interface CounterRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  /** Précision optionnelle sous le libellé — utile pour "Capacité d'accueil". */
  hint?: string;
}

export function CounterRow({ icon: Icon, label, value, onChange, min, max, hint }: CounterRowProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {/* Libellé — largeur pleine, jamais tronqué */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="marker-box h-9 w-9 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-foreground">{label}</p>
          {hint && <p className="mt-0.5 text-xs leading-snug text-foreground-muted">{hint}</p>}
        </div>
      </div>

      {/* Stepper — pleine largeur et espacé sur mobile, compact sur desktop */}
      <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-2">
        <button
          type="button"
          aria-label={`Diminuer : ${label}`}
          disabled={value <= min}
          onClick={dec}
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-pill border border-border',
            'bg-background-card text-foreground transition-colors duration-150',
            'hover:border-forest-400 hover:bg-forest-50',
            'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-background-card',
            'sm:h-9 sm:w-9',
          )}
        >
          <Minus className="h-4 w-4" />
        </button>

        <span
          className="w-8 shrink-0 text-center font-display text-lg font-semibold tabular-nums text-foreground"
          aria-live="polite"
        >
          {value}
        </span>

        <button
          type="button"
          aria-label={`Augmenter : ${label}`}
          disabled={value >= max}
          onClick={inc}
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-pill border border-border',
            'bg-background-card text-foreground transition-colors duration-150',
            'hover:border-forest-400 hover:bg-forest-50',
            'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-background-card',
            'sm:h-9 sm:w-9',
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}