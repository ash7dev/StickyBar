import { DayRange, addDays, daysBetween } from '../calendar/day-range';

/**
 * Taux d'occupation, définition du secteur :
 *   nuits réservées ÷ (nuits de la période − nuits bloquées par le propriétaire)
 *
 * Une nuit à la fois réservée et bloquée compte comme réservée (jamais retirée du
 * dénominateur). Plages semi-ouvertes `[start, end)`, comme partout ailleurs.
 */
export interface Occupancy {
  bookedNights: number;
  /** Nuits réellement proposées à la location (période − blocages) */
  availableNights: number;
  /** 0 à 1 ; 0 quand aucune nuit n'était disponible */
  rate: number;
}

/** Nuits (jours `YYYY-MM-DD`) des plages qui tombent dans la fenêtre, sans doublon. */
export function nightsInWindow(ranges: DayRange[], window: DayRange): Set<string> {
  const nights = new Set<string>();
  for (const range of ranges) {
    const start = range.start > window.start ? range.start : window.start;
    const end = range.end < window.end ? range.end : window.end;
    for (let d = start; d < end; d = addDays(d, 1)) nights.add(d);
  }
  return nights;
}

export function computeOccupancy(booked: DayRange[], blocked: DayRange[], window: DayRange): Occupancy {
  const bookedNights = nightsInWindow(booked, window);
  const blockedOnly = [...nightsInWindow(blocked, window)].filter((d) => !bookedNights.has(d));
  const availableNights = daysBetween(window.start, window.end) - blockedOnly.length;
  return {
    bookedNights: bookedNights.size,
    availableNights,
    rate: availableNights > 0 ? bookedNights.size / availableNights : 0,
  };
}

/** Nuits libres (ni réservées, ni bloquées) dans la fenêtre. */
export function freeNights(occupied: DayRange[], blocked: DayRange[], window: DayRange): number {
  const taken = nightsInWindow([...occupied, ...blocked], window);
  return daysBetween(window.start, window.end) - taken.size;
}
