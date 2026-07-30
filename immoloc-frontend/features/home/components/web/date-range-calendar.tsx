'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires de date — sans dépendance
// ─────────────────────────────────────────────────────────────────────────────

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isBefore = (a: Date, b: Date) => startOfDay(a).getTime() < startOfDay(b).getTime();
const isAfter = (a: Date, b: Date) => startOfDay(a).getTime() > startOfDay(b).getTime();
const diffDays = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);

const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const fullLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const shortLabel = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });

// Semaine commençant lundi — la norme au Sénégal comme en France.
const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

/** Grille de 6 semaines couvrant le mois, complétée par les jours adjacents. */
function buildMonthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // getDay() : 0 = dimanche. On décale pour que lundi = 0.
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// ─────────────────────────────────────────────────────────────────────────────

export type DateRange = { from: Date | null; to: Date | null };

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Nombre minimum de nuits entre l'arrivée et le départ. */
  minNights?: number;
  /** Première date sélectionnable. Par défaut : aujourd'hui. */
  minDate?: Date;
  /** Sur quel champ le sélecteur a été ouvert — pilote le premier clic. */
  focusField?: 'from' | 'to';
  onClose?: () => void;
}

export function DateRangeCalendar({
  value,
  onChange,
  minNights = 1,
  minDate,
  focusField = 'from',
  onClose,
}: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const floor = useMemo(() => startOfDay(minDate ?? today), [minDate, today]);

  const [viewMonth, setViewMonth] = useState<Date>(() =>
    addMonths(value.from ?? floor, 0),
  );
  const [hovered, setHovered] = useState<Date | null>(null);
  const [focused, setFocused] = useState<Date>(() => value.from ?? floor);

  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);

  // Déplace le focus DOM sur la cellule active — indispensable pour que la
  // navigation au clavier soit annoncée par un lecteur d'écran.
  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  }, [focused]);

  const isDisabled = useCallback((d: Date) => isBefore(d, floor), [floor]);

  // Le second clic ne peut pas tomber avant l'arrivée + minNights.
  const selectingEnd = focusField === 'to' || (!!value.from && !value.to);

  const handleSelect = useCallback(
    (day: Date) => {
      if (isDisabled(day)) return;

      if (!selectingEnd || !value.from) {
        onChange({ from: day, to: null });
        return;
      }

      if (!isAfter(day, value.from) || diffDays(value.from, day) < minNights) {
        // Clic avant l'arrivée, ou séjour trop court : on repart de ce jour.
        onChange({ from: day, to: null });
        return;
      }

      onChange({ from: value.from, to: day });
      onClose?.();
    },
    [isDisabled, selectingEnd, value.from, minNights, onChange, onClose],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const jump: Record<string, number> = {
        ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
      };

      if (e.key in jump) {
        e.preventDefault();
        const next = addDays(focused, jump[e.key]);
        shouldFocus.current = true;
        setFocused(next);
        if (next.getMonth() !== viewMonth.getMonth() || next.getFullYear() !== viewMonth.getFullYear()) {
          setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
        return;
      }

      if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        const next = addMonths(focused, e.key === 'PageUp' ? -1 : 1);
        const clamped = new Date(next.getFullYear(), next.getMonth(),
          Math.min(focused.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        shouldFocus.current = true;
        setFocused(clamped);
        setViewMonth(new Date(clamped.getFullYear(), clamped.getMonth(), 1));
        return;
      }

      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        const dow = (focused.getDay() + 6) % 7;
        const next = addDays(focused, e.key === 'Home' ? -dow : 6 - dow);
        shouldFocus.current = true;
        setFocused(next);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(focused);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    },
    [focused, viewMonth, handleSelect, onClose],
  );

  const months = [viewMonth, addMonths(viewMonth, 1)];
  const canGoBack = isAfter(viewMonth, new Date(floor.getFullYear(), floor.getMonth(), 1));

  const nights = value.from && value.to ? diffDays(value.from, value.to) : null;

  return (
    <div
      className="w-[min(92vw,44rem)] rounded-card border border-border bg-background-card p-4 shadow-xl"
      onKeyDown={onKeyDown}
    >
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          disabled={!canGoBack}
          aria-label="Mois précédent"
          className="grid h-9 w-9 place-items-center rounded-pill text-forest-800 transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div aria-live="polite" className="text-sm font-semibold text-foreground">
          {nights
            ? `${nights} nuit${nights > 1 ? 's' : ''}`
            : value.from
              ? 'Choisissez la date de départ'
              : 'Choisissez la date d’arrivée'}
        </div>

        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          aria-label="Mois suivant"
          className="grid h-9 w-9 place-items-center rounded-pill text-forest-800 transition-colors hover:bg-neutral-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Mois ────────────────────────────────────────────────────────── */}
      <div ref={gridRef} className="grid gap-6 sm:grid-cols-2">
        {months.map((m, mi) => (
          <div key={mi} className={mi === 1 ? 'hidden sm:block' : undefined}>
            <div className="mb-2 text-center text-sm font-semibold capitalize text-foreground">
              {monthLabel.format(m)}
            </div>

            <div role="grid" aria-label={monthLabel.format(m)}>
              <div role="row" className="grid grid-cols-7">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    role="columnheader"
                    title={w}
                    className="py-1 text-center text-[0.6875rem] font-medium uppercase tracking-wide text-foreground-faint"
                  >
                    {w.charAt(0)}
                  </div>
                ))}
              </div>

              {Array.from({ length: 6 }, (_, week) => (
                <div role="row" key={week} className="grid grid-cols-7">
                  {buildMonthGrid(m)
                    .slice(week * 7, week * 7 + 7)
                    .map((day) => {
                      const outside = day.getMonth() !== m.getMonth();
                      const disabled = isDisabled(day);

                      const isFrom = value.from && isSameDay(day, value.from);
                      const isTo = value.to && isSameDay(day, value.to);

                      // Aperçu de la plage au survol, avant le second clic.
                      const previewEnd = value.to ?? (value.from && hovered && isAfter(hovered, value.from) ? hovered : null);
                      const inRange =
                        value.from && previewEnd &&
                        isAfter(day, value.from) && isBefore(day, previewEnd);

                      const isEdge = isFrom || isTo;

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          role="gridcell"
                          data-focused={isSameDay(day, focused)}
                          tabIndex={isSameDay(day, focused) ? 0 : -1}
                          disabled={disabled || outside}
                          aria-label={fullLabel.format(day)}
                          aria-selected={!!isEdge}
                          onClick={() => handleSelect(day)}
                          onMouseEnter={() => setHovered(day)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setFocused(day)}
                          className={[
                            'relative h-10 text-sm tabular-nums transition-colors duration-150',
                            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                            outside ? 'invisible' : '',
                            disabled ? 'cursor-not-allowed text-foreground-faint line-through decoration-1' : '',
                            // Fond de plage : rectangle continu, coins arrondis aux extrémités
                            inRange ? 'bg-lime-100' : '',
                            isFrom && value.to ? 'rounded-l-pill bg-lime-100' : '',
                            isTo ? 'rounded-r-pill bg-lime-100' : '',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'absolute inset-0.5 grid place-items-center rounded-pill transition-colors duration-150',
                              isEdge
                                ? 'bg-forest-800 font-semibold text-neutral-50'
                                : disabled
                                  ? ''
                                  : 'hover:bg-neutral-100',
                            ].join(' ')}
                          >
                            {day.getDate()}
                          </span>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pied ────────────────────────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <p className="text-xs text-foreground-muted">
          {minNights > 1 ? `Séjour minimum : ${minNights} nuits` : 'Séjour minimum : 1 nuit'}
        </p>
        <button
          type="button"
          onClick={() => onChange({ from: null, to: null })}
          className="rounded-pill px-3 py-1.5 text-sm font-semibold text-forest-700 underline-offset-4 transition-colors hover:bg-neutral-100 hover:underline"
        >
          Effacer
        </button>
      </div>
    </div>
  );
}