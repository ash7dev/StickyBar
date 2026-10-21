'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Home } from 'lucide-react';
import { toast } from 'sonner';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import {
  addDays,
  dayOfMonth,
  diffDays,
  eachDay,
  formatLong,
  formatMonth,
  formatRange,
  formatWeekday,
  isWeekend,
  type Day,
} from '../lib/days';
import { OCCUPYING_STATUSES, STATUS_META, eventStatus } from '../lib/event-styles';

/** Largeur d'une colonne jour, en px (alignée sur la classe `w-12`). */
const DAY_WIDTH = 48;

interface Selection {
  logementId: string;
  anchor: Day;
  current: Day;
  /** Glisser à la souris en cours ; sinon on attend le second clic. */
  dragging: boolean;
}

interface OwnerCalendarTimelineProps {
  logements: OwnerCalendarLogement[];
  events: OwnerCalendarEvent[];
  /** Premier jour affiché */
  start: Day;
  dayCount: number;
  today: Day;
  /** Plage sélectionnée : `end` exclu */
  onSelectRange: (logementId: string, start: Day, end: Day) => void;
  onEventClick: (event: OwnerCalendarEvent) => void;
}

export function OwnerCalendarTimeline({
  logements,
  events,
  start,
  dayCount,
  today,
  onSelectRange,
  onEventClick,
}: OwnerCalendarTimelineProps) {
  const days = useMemo(() => eachDay(start, dayCount), [start, dayCount]);
  const end = days[days.length - 1] ? addDays(days[days.length - 1], 1) : start;

  const eventsByLogement = useMemo(() => {
    const map = new Map<string, OwnerCalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.logementId) ?? [];
      list.push(event);
      map.set(event.logementId, list);
    }
    return map;
  }, [events]);

  // ── Sélection d'une plage (souris : glisser ; tactile / clavier : deux appuis) ──
  const [selection, setSelection] = useState<Selection | null>(null);
  // Lue par les gestionnaires d'événements globaux (pointerup) sans les réabonner
  const selectionRef = useRef(selection);
  useLayoutEffect(() => {
    selectionRef.current = selection;
  }, [selection]);
  const mouseHandledRef = useRef(false);

  const finalize = useCallback(
    (logementId: string, a: Day, b: Day) => {
      setSelection(null);
      const first = a < b ? a : b;
      const rangeEnd = addDays(a < b ? b : a, 1);
      const occupied = (eventsByLogement.get(logementId) ?? []).some(
        (e) =>
          e.kind === 'RESERVATION' &&
          OCCUPYING_STATUSES.has(e.statut) &&
          e.start < rangeEnd &&
          e.end > first,
      );
      if (occupied) {
        toast.error('Ces dates contiennent une réservation : choisissez des nuits libres.');
        return;
      }
      onSelectRange(logementId, first, rangeEnd);
    },
    [eventsByLogement, onSelectRange],
  );

  useEffect(() => {
    function onPointerUp() {
      const sel = selectionRef.current;
      if (!sel?.dragging) return;
      if (sel.current !== sel.anchor) finalize(sel.logementId, sel.anchor, sel.current);
      else setSelection({ ...sel, dragging: false });
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelection(null);
    }
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [finalize]);

  const handleCellPointerDown = useCallback(
    (logementId: string, day: Day, e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      mouseHandledRef.current = true;
      e.preventDefault(); // évite la sélection de texte pendant le glisser
      const sel = selectionRef.current;
      if (sel && !sel.dragging && sel.logementId === logementId) {
        finalize(logementId, sel.anchor, day);
        return;
      }
      setSelection({ logementId, anchor: day, current: day, dragging: true });
    },
    [finalize],
  );

  const handleCellPointerEnter = useCallback((logementId: string, day: Day) => {
    const sel = selectionRef.current;
    if (sel?.dragging && sel.logementId === logementId && sel.current !== day) {
      setSelection({ ...sel, current: day });
    }
  }, []);

  /** Tactile et clavier : premier appui = début, second appui = fin. */
  const handleCellClick = useCallback(
    (logementId: string, day: Day) => {
      if (mouseHandledRef.current) {
        mouseHandledRef.current = false;
        return;
      }
      const sel = selectionRef.current;
      if (sel && sel.logementId === logementId) finalize(logementId, sel.anchor, day);
      else setSelection({ logementId, anchor: day, current: day, dragging: false });
    },
    [finalize],
  );

  const months = useMemo(() => groupByMonth(days), [days]);
  const todayIndex = diffDays(start, today);
  const trackWidth = dayCount * DAY_WIDTH;

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-background-card shadow-sm">
      {selection && !selection.dragging && (
        <p
          role="status"
          className="border-b border-border bg-forest-50 px-4 py-2 text-xs font-medium text-forest-800"
        >
          Début : {formatLong(selection.anchor)}. Choisissez le dernier jour à bloquer (Échap pour annuler).
        </p>
      )}

      <div className="overflow-x-auto overscroll-x-contain">
        <div style={{ minWidth: `calc(var(--cal-label) + ${trackWidth}px)` }} className="[--cal-label:8.5rem] sm:[--cal-label:14rem]">
          {/* ── En-tête : mois puis jours ──────────────────────────────────── */}
          <div className="sticky top-0 z-20 flex border-b border-border bg-background-card">
            <div className="sticky left-0 z-30 w-[var(--cal-label)] shrink-0 border-r border-border bg-background-card" />
            <div className="relative" style={{ width: trackWidth }}>
              <div className="flex border-b border-border">
                {months.map((m) => (
                  <div
                    key={m.key}
                    className="truncate border-r border-border px-2 py-1.5 text-xs font-semibold capitalize text-foreground last:border-r-0"
                    style={{ width: m.count * DAY_WIDTH }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div className="flex">
                {days.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      'flex w-12 shrink-0 flex-col items-center py-1.5 text-[0.7rem] leading-tight',
                      isWeekend(day) && 'bg-neutral-50',
                      day === today ? 'text-forest-700' : 'text-foreground-muted',
                    )}
                  >
                    <span className="capitalize">{formatWeekday(day).replace('.', '')}</span>
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 items-center justify-center rounded-pill text-xs font-semibold',
                        day === today ? 'bg-forest-600 text-white' : 'text-foreground',
                      )}
                    >
                      {dayOfMonth(day)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Une ligne par logement ─────────────────────────────────────── */}
          {logements.map((logement) => (
            <CalendarRow
              key={logement.id}
              logement={logement}
              events={eventsByLogement.get(logement.id) ?? []}
              days={days}
              windowStart={start}
              windowEnd={end}
              today={today}
              todayIndex={todayIndex}
              selection={selection?.logementId === logement.id ? selection : null}
              onCellPointerDown={handleCellPointerDown}
              onCellPointerEnter={handleCellPointerEnter}
              onCellClick={handleCellClick}
              onEventClick={onEventClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface CalendarRowProps {
  logement: OwnerCalendarLogement;
  events: OwnerCalendarEvent[];
  days: Day[];
  windowStart: Day;
  windowEnd: Day;
  today: Day;
  todayIndex: number;
  selection: Selection | null;
  onCellPointerDown: (logementId: string, day: Day, e: React.PointerEvent) => void;
  onCellPointerEnter: (logementId: string, day: Day) => void;
  onCellClick: (logementId: string, day: Day) => void;
  onEventClick: (event: OwnerCalendarEvent) => void;
}

const CalendarRow = memo(function CalendarRow({
  logement,
  events,
  days,
  windowStart,
  windowEnd,
  today,
  todayIndex,
  selection,
  onCellPointerDown,
  onCellPointerEnter,
  onCellClick,
  onEventClick,
}: CalendarRowProps) {
  const selFirst = selection ? (selection.anchor < selection.current ? selection.anchor : selection.current) : null;
  const selLast = selection ? (selection.anchor < selection.current ? selection.current : selection.anchor) : null;
  const trackWidth = days.length * DAY_WIDTH;

  return (
    <div className="flex border-b border-border last:border-b-0">
      <div className="sticky left-0 z-10 flex w-[var(--cal-label)] shrink-0 items-center gap-2.5 border-r border-border bg-background-card px-2.5 py-2 sm:px-3">
        <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-inner bg-neutral-100 sm:block">
          {logement.photoUrl ? (
            <Image src={logement.photoUrl} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <Home className="m-auto h-full w-4 text-foreground-muted" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground sm:text-sm" title={logement.titre}>
            {logement.titre}
          </p>
          <p className="truncate text-[0.7rem] text-foreground-muted">{logement.ville}</p>
        </div>
      </div>

      <div className="relative h-16" style={{ width: trackWidth }}>
        {/* Cellules cliquables */}
        <div className="absolute inset-0 flex">
          {days.map((day) => {
            const isPast = day < today;
            const selected = selFirst !== null && selLast !== null && day >= selFirst && day <= selLast;
            return (
              <button
                key={day}
                type="button"
                disabled={isPast}
                aria-label={`${logement.titre}, ${formatLong(day)}`}
                aria-pressed={selected}
                onPointerDown={(e) => onCellPointerDown(logement.id, day, e)}
                onPointerEnter={() => onCellPointerEnter(logement.id, day)}
                onClick={() => onCellClick(logement.id, day)}
                className={cn(
                  'h-full w-12 shrink-0 border-r border-border/60 outline-none transition-colors last:border-r-0',
                  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isWeekend(day) && 'bg-neutral-50',
                  isPast ? 'cursor-not-allowed bg-neutral-100/60' : 'cursor-cell hover:bg-forest-50',
                  selected && 'bg-forest-100 hover:bg-forest-100',
                )}
              />
            );
          })}
        </div>

        {/* Repère « aujourd'hui » */}
        {todayIndex >= 0 && todayIndex < days.length && (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-forest-500/50"
            style={{ left: (todayIndex + 0.5) * DAY_WIDTH }}
            aria-hidden="true"
          />
        )}

        {/* Séjours et blocages */}
        {events.map((event) => (
          <EventBar
            key={`${event.kind}-${event.id}`}
            event={event}
            windowStart={windowStart}
            windowEnd={windowEnd}
            onClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

interface EventBarProps {
  event: OwnerCalendarEvent;
  windowStart: Day;
  windowEnd: Day;
  onClick: (event: OwnerCalendarEvent) => void;
}

/**
 * Une barre couvre des nuits : elle commence au milieu du jour d'arrivée et finit au
 * milieu du jour de départ, ce qui rend visibles les rotations le même jour.
 */
function EventBar({ event, windowStart, windowEnd, onClick }: EventBarProps) {
  const maxX = diffDays(windowStart, windowEnd) * DAY_WIDTH;
  const rawLeft = (diffDays(windowStart, event.start) + 0.5) * DAY_WIDTH;
  const rawRight = (diffDays(windowStart, event.end) + 0.5) * DAY_WIDTH;
  const left = Math.max(rawLeft, 0);
  const right = Math.min(rawRight, maxX);
  if (right - left <= 0) return null;

  const status = STATUS_META[eventStatus(event)];
  const label =
    event.kind === 'RESERVATION'
      ? `${event.locataire.prenom} ${event.locataire.nomInitiale}`.trim()
      : event.motif || 'Bloqué';
  const nights = diffDays(event.start, event.end);

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      title={`${label} · ${formatRange(event.start, event.end)}`}
      aria-label={`${status.label} : ${label}, ${formatRange(event.start, event.end)}, ${nights} nuit${nights > 1 ? 's' : ''}`}
      className={cn(
        'absolute top-3 z-[5] flex h-10 items-center gap-1.5 overflow-hidden px-2.5 text-left text-xs font-semibold shadow-xs',
        'transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        rawLeft >= 0 ? 'rounded-l-inner' : 'rounded-l-none',
        rawRight <= maxX ? 'rounded-r-inner' : 'rounded-r-none',
        status.bar,
      )}
      style={{ left, width: right - left }}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function groupByMonth(days: Day[]) {
  const groups: Array<{ key: string; label: string; count: number }> = [];
  for (const day of days) {
    const key = day.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.count += 1;
    else groups.push({ key, label: formatMonth(day), count: 1 });
  }
  return groups;
}
