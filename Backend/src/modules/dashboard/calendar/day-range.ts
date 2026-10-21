/**
 * Utilitaires de plages de jours pour le calendrier propriétaire.
 *
 * Convention (identique à create-reservation.use-case) :
 * - un jour est une chaîne `YYYY-MM-DD` interprétée en UTC (Dakar = UTC+0) ;
 * - une plage est semi-ouverte `[start, end)` : `end` est exclu
 *   (pour une réservation, c'est le jour du départ).
 */

const DAY_MS = 86_400_000;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DayRange {
  start: string;
  end: string;
}

/** Date → `YYYY-MM-DD` (UTC). */
export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` → Date à minuit UTC. Lève une erreur si la chaîne n'est pas un jour valide. */
export function parseDay(day: string): Date {
  if (!DAY_PATTERN.test(day)) {
    throw new RangeError(`Jour invalide : "${day}" (format attendu YYYY-MM-DD)`);
  }
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || toDay(date) !== day) {
    throw new RangeError(`Jour invalide : "${day}"`);
  }
  return date;
}

export function addDays(day: string, days: number): string {
  return toDay(new Date(parseDay(day).getTime() + days * DAY_MS));
}

/** Nombre de jours entre deux jours (`end` exclu). */
export function daysBetween(start: string, end: string): number {
  return Math.round((parseDay(end).getTime() - parseDay(start).getTime()) / DAY_MS);
}

/** Deux plages semi-ouvertes se chevauchent si A.start < B.end et A.end > B.start. */
export function rangesOverlap(a: DayRange, b: DayRange): boolean {
  return a.start < b.end && a.end > b.start;
}

/** Deux plages se touchent ou se chevauchent (fusionnables en une seule). */
export function rangesTouch(a: DayRange, b: DayRange): boolean {
  return a.start <= b.end && a.end >= b.start;
}

/** Plus petite plage couvrant toutes les plages données. */
export function coveringRange(ranges: DayRange[]): DayRange {
  if (ranges.length === 0) throw new RangeError('Aucune plage à couvrir');
  return ranges.reduce((acc, r) => ({
    start: r.start < acc.start ? r.start : acc.start,
    end: r.end > acc.end ? r.end : acc.end,
  }));
}

/** Premier jour du mois de `day`, décalé de `offset` mois (`2026-10-19`, -1 → `2026-09-01`). */
export function monthStart(day: string, offset = 0): string {
  const d = parseDay(`${day.slice(0, 7)}-01`);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return toDay(d);
}
