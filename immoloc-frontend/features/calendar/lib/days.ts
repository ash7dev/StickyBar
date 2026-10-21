/**
 * Jours calendaires côté client.
 *
 * Un jour est une chaîne `YYYY-MM-DD`. Les calculs passent par UTC pour ne jamais
 * dépendre du fuseau du navigateur (un propriétaire à Paris voit les mêmes jours
 * qu'à Dakar). Les plages sont semi-ouvertes : `end` est exclu, comme côté API.
 */

const DAY_MS = 86_400_000;

export type Day = string;

/** Jour local du navigateur (ce que l'utilisateur appelle « aujourd'hui »). */
export function todayDay(): Day {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function toUtc(day: Day): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function fromUtc(date: Date): Day {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: Day, days: number): Day {
  return fromUtc(new Date(toUtc(day).getTime() + days * DAY_MS));
}

/** Nombre de jours de `start` à `end` (exclu). */
export function diffDays(start: Day, end: Day): number {
  return Math.round((toUtc(end).getTime() - toUtc(start).getTime()) / DAY_MS);
}

/** Lundi de la semaine contenant `day`. */
export function startOfWeek(day: Day): Day {
  const weekday = (toUtc(day).getUTCDay() + 6) % 7; // lundi = 0
  return addDays(day, -weekday);
}

export function eachDay(start: Day, count: number): Day[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function isWeekend(day: Day): boolean {
  const weekday = toUtc(day).getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function dayOfMonth(day: Day): number {
  return toUtc(day).getUTCDate();
}

const weekdayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** « lun. » */
export function formatWeekday(day: Day): string {
  return weekdayFormatter.format(toUtc(day));
}

/** « octobre 2026 » */
export function formatMonth(day: Day): string {
  return monthFormatter.format(toUtc(day));
}

/** « 19 oct. » */
export function formatShort(day: Day): string {
  return shortFormatter.format(toUtc(day));
}

/** « lundi 19 octobre 2026 » */
export function formatLong(day: Day): string {
  return longFormatter.format(toUtc(day));
}

/** « 19 oct. → 22 oct. » ; la date de fin exclue est affichée telle quelle (jour du départ). */
export function formatRange(start: Day, end: Day): string {
  return `${formatShort(start)} → ${formatShort(end)}`;
}
