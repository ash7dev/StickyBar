import { colors } from '../../../shared/theme/tokens';
import type {
  OwnerCalendarBlockEvent,
  OwnerCalendarEvent,
  OwnerCalendarLogement,
  OwnerCalendarReservationEvent,
} from '../types';
import { OCCUPYING_STATUSES } from './event-styles';
import { addDays, diffDays, type Day } from './days';

/** Une couleur stable par logement (ordre de l'API), reprise dans la frise, le mois et les filtres. */
const LOGEMENT_PALETTE = [colors.forest[600], colors.lime[600], colors.gold[400], colors.forest[300], colors.gold[600]];

export function logementColor(logements: OwnerCalendarLogement[], logementId: string): string {
  const index = logements.findIndex((l) => l.id === logementId);
  return LOGEMENT_PALETTE[(index < 0 ? 0 : index) % LOGEMENT_PALETTE.length];
}

export function isOccupying(e: OwnerCalendarEvent): e is OwnerCalendarReservationEvent {
  return e.kind === 'RESERVATION' && OCCUPYING_STATUSES.has(e.statut);
}

/** La nuit `day` est-elle couverte par l'événement (plage semi-ouverte) ? */
export function coversNight(e: OwnerCalendarEvent, day: Day): boolean {
  return e.start <= day && e.end > day;
}

/** Part des nuits louées sur [from, from + days), tous logements confondus. */
export function occupancyRate(
  events: OwnerCalendarEvent[],
  logements: OwnerCalendarLogement[],
  from: Day,
  days: number,
): number {
  if (logements.length === 0) return 0;
  const to = addDays(from, days);
  const booked = events.filter(isOccupying).reduce((sum, e) => {
    const start = e.start > from ? e.start : from;
    const end = e.end < to ? e.end : to;
    return sum + Math.max(diffDays(start, end), 0);
  }, 0);
  return booked / (logements.length * days);
}

export type DayMove =
  | { kind: 'ARRIVAL' | 'DEPARTURE'; event: OwnerCalendarReservationEvent }
  | { kind: 'BLOCK'; event: OwnerCalendarBlockEvent };

/** Arrivées, départs et débuts de blocage d'un jour donné. */
export function movesOn(events: OwnerCalendarEvent[], day: Day): DayMove[] {
  const moves: DayMove[] = [];
  for (const e of events) {
    if (e.kind === 'BLOCK') {
      if (e.start === day) moves.push({ kind: 'BLOCK', event: e });
    } else if (OCCUPYING_STATUSES.has(e.statut) || e.statut === 'COMPLETED') {
      if (e.end === day) moves.push({ kind: 'DEPARTURE', event: e });
      if (e.start === day) moves.push({ kind: 'ARRIVAL', event: e });
    }
  }
  // Départs d'abord (le matin), puis arrivées, puis blocages
  const order = { DEPARTURE: 0, ARRIVAL: 1, BLOCK: 2 } as const;
  return moves.sort((a, b) => order[a.kind] - order[b.kind]);
}

/** Logements sans réservation ni blocage la nuit `day`. */
export function freeLogements(
  events: OwnerCalendarEvent[],
  logements: OwnerCalendarLogement[],
  day: Day,
): OwnerCalendarLogement[] {
  return logements.filter(
    (l) => !events.some((e) => e.logementId === l.id && (e.kind === 'BLOCK' || isOccupying(e)) && coversNight(e, day)),
  );
}

export type NightState = 'free' | 'booked' | 'pending' | 'blocked';

/** État d'une nuit pour un logement : réservée, demande à décider, bloquée ou libre. */
export function nightState(events: OwnerCalendarEvent[], logementId: string, day: Day): NightState {
  let state: NightState = 'free';
  for (const e of events) {
    if (e.logementId !== logementId || !coversNight(e, day)) continue;
    if (e.kind === 'BLOCK') state = 'blocked';
    else if (e.statut === 'PAID' || e.statut === 'PENDING') return 'pending';
    else if (isOccupying(e)) return 'booked';
  }
  return state;
}

/** 45 000 → « 45k », 1 200 000 → « 1,2M » (cases de calendrier). */
export function compactPrice(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(Math.round(amount));
}
