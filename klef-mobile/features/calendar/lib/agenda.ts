import type { OwnerCalendarEvent, OwnerCalendarBlockEvent, OwnerCalendarReservationEvent } from '../types';
import type { Day } from './days';

export type AgendaItem =
  | { kind: 'DEPARTURE'; day: Day; event: OwnerCalendarReservationEvent }
  | { kind: 'ARRIVAL'; day: Day; event: OwnerCalendarReservationEvent }
  | { kind: 'BLOCK'; day: Day; event: OwnerCalendarBlockEvent };

export interface AgendaDay {
  day: Day;
  items: AgendaItem[];
}

/** Séjours qui donnent lieu à une arrivée ou un départ réel (les demandes sont traitées à part). */
const STAY_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DISPUTED']);

/** Ordre dans une journée : on libère le logement avant d'accueillir. */
const KIND_ORDER: Record<AgendaItem['kind'], number> = { DEPARTURE: 0, ARRIVAL: 1, BLOCK: 2 };

/**
 * Regroupe arrivées, départs et débuts de blocage par jour sur [from, to).
 * Les jours sans événement sont omis.
 */
export function buildAgenda(
  events: OwnerCalendarEvent[],
  from: Day,
  to: Day,
  logementId: string | null,
): AgendaDay[] {
  const inRange = (day: Day) => day >= from && day < to;
  const items: AgendaItem[] = [];

  for (const event of events) {
    if (logementId && event.logementId !== logementId) continue;

    if (event.kind === 'BLOCK') {
      if (inRange(event.start)) items.push({ kind: 'BLOCK', day: event.start, event });
      continue;
    }
    if (!STAY_STATUSES.has(event.statut)) continue;
    if (inRange(event.start)) items.push({ kind: 'ARRIVAL', day: event.start, event });
    if (inRange(event.end)) items.push({ kind: 'DEPARTURE', day: event.end, event });
  }

  items.sort((a, b) => a.day.localeCompare(b.day) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);

  const days: AgendaDay[] = [];
  for (const item of items) {
    const last = days[days.length - 1];
    if (last?.day === item.day) last.items.push(item);
    else days.push({ day: item.day, items: [item] });
  }
  return days;
}

/** « expire dans 18 h », « expire dans 25 min », « délai dépassé ». */
export function formatExpiry(expiresAt: string, now: number = Date.now()): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (Number.isNaN(ms) || ms <= 0) return 'délai dépassé';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `expire dans ${Math.max(minutes, 1)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `expire dans ${hours} h`;
  return `expire dans ${Math.floor(hours / 24)} j`;
}
