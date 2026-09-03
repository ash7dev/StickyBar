'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, MapPin, Building2, Check, X, ArrowRight, RotateCcw } from 'lucide-react';
import {
  useHomePreferences,
  AVAILABLE_ZONES,
  AVAILABLE_SOUS_TYPES,
  MAX_ZONES,
  MAX_SOUS_TYPES,
} from '@/lib/hooks/useHomePreferences';
import { cn } from '@/lib/utils/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function HomePersonalizationModal({ isOpen, onClose }: Props) {
  const {
    preferences, toggleZone, toggleSousType, clearFilters, completeOnboarding,
    canAddZone, canAddSousType, hasActivePreferences,
  } = useHomePreferences();

  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [confirmReset, setConfirmReset] = useState(false);
  const [mounted, setMounted] = useState(false);

  const titleId = useId();
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Ni Échap, ni piège à focus, ni verrou de scroll : la page défilait
     derrière la modale et Tab en sortait librement. */
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
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
  }, [isOpen, onClose]);

  /* L'étape et la confirmation restaient figées d'une ouverture à l'autre. */
  useEffect(() => {
    if (!isOpen) { setActiveStep(1); setConfirmReset(false); }
  }, [isOpen]);

  const handleSave = useCallback(() => {
    completeOnboarding();
    onClose();
  }, [completeOnboarding, onClose]);

  const handleReset = useCallback(() => {
    if (!confirmReset) { setConfirmReset(true); return; }
    /* `resetPreferences` remettait aussi `hasCompletedOnboarding` à false :
       l'onboarding était reproposé au chargement suivant. Vider ses filtres
       n'est pas repartir de zéro. */
    clearFilters();
    setConfirmReset(false);
  }, [confirmReset, clearFilters]);

  if (!isOpen || !mounted) return null;

  const isStep1 = activeStep === 1;
  const items = isStep1 ? AVAILABLE_ZONES : AVAILABLE_SOUS_TYPES;
  const selected = isStep1 ? preferences.zones : preferences.sousTypes;
  const canAdd = isStep1 ? canAddZone : canAddSousType;
  const toggle = isStep1 ? toggleZone : toggleSousType;
  const ItemIcon = isStep1 ? MapPin : Building2;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-forest-950/75 backdrop-blur-md sm:items-center sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-card border border-border bg-background-card sm:max-w-2xl sm:rounded-card"
      >
        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <div className="shrink-0 space-y-2 border-b border-border p-6 pb-5 sm:p-8 sm:pb-5">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground-muted transition-colors hover:bg-background-card hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 pr-12">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill border border-forest-100 bg-forest-50 text-forest-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="eyebrow text-foreground-muted">Personnalisation</span>
          </div>

          <h2 id={titleId} className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {isStep1 ? 'Vos destinations' : 'Vos types de logement'}
          </h2>
          <p className="text-sm text-foreground-muted">
            {isStep1
              ? `Sélectionnez jusqu’à ${MAX_ZONES} zones pour personnaliser votre page d’accueil.`
              : `Choisissez jusqu’à ${MAX_SOUS_TYPES} types de logement à mettre en avant.`}
          </p>

          {/* ── Étapes ─────────────────────────────────────────────────── */}

          <div role="tablist" aria-label="Étapes" className="flex flex-wrap items-center gap-2 pt-2">
            {([
              { n: 1 as const, icon: MapPin, label: 'Zones', count: preferences.zones.length, max: MAX_ZONES },
              { n: 2 as const, icon: Building2, label: 'Types', count: preferences.sousTypes.length, max: MAX_SOUS_TYPES },
            ]).map(({ n, icon: Icon, label, count, max }) => (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={activeStep === n}
                aria-controls={panelId}
                onClick={() => setActiveStep(n)}
                className={cn(
                  'flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  activeStep === n
                    ? 'border-forest-600 bg-forest-600 text-neutral-0'
                    : 'border-border bg-background-alt text-foreground-muted hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {n}. {label}
                <span className="tabular-nums opacity-80">{count}/{max}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Sélection ────────────────────────────────────────────────── */}

        <div
          id={panelId}
          role="tabpanel"
          className="flex-1 overflow-y-auto p-6 sm:px-8"
        >
          <div className="flex flex-wrap gap-2.5">
            {items.map((item) => {
              const isSelected = selected.includes(item);
              const isBlocked = !isSelected && !canAdd;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  disabled={isBlocked}
                  aria-pressed={isSelected}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-pill border px-4 py-2.5 text-sm font-semibold transition-colors active:scale-[0.97]',
                    isSelected
                      ? 'border-forest-600 bg-forest-600 text-neutral-0'
                      : 'border-border bg-background-alt text-foreground hover:border-forest-300 hover:bg-background-card',
                    isBlocked && 'cursor-not-allowed opacity-40 hover:border-border hover:bg-background-alt',
                  )}
                >
                  {isSelected
                    ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    : <ItemIcon className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />}
                  {item}
                </button>
              );
            })}
          </div>

          {/* La limite n'était signalée que par des chips grisées, sans
             explication de ce qui bloque. */}
          {!canAdd && (
            <p aria-live="polite" className="mt-4 rounded-inner border border-border bg-background-alt p-3 text-xs text-foreground-muted">
              Maximum atteint. Désélectionnez un élément pour en choisir un autre.
            </p>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border bg-background-alt p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-5">
          <button
            type="button"
            onClick={handleReset}
            onBlur={() => setConfirmReset(false)}
            disabled={!hasActivePreferences}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-40',
              confirmReset ? 'text-error-700' : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {confirmReset ? 'Confirmer l’effacement' : 'Tout effacer'}
          </button>

          <div className="ml-auto flex items-center gap-3">
            {isStep1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt"
              >
                Suivant
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              /* ★ Seul aplat lime : la validation. */
              <button type="button" onClick={handleSave} className="btn-action text-sm">
                <Check className="h-4 w-4" aria-hidden="true" />
                Appliquer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}