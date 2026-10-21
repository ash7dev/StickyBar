/**
 * Jours calendaires (`YYYY-MM-DD`), identiques à l'API et au web.
 *
 * Les calculs passent par UTC pour ne jamais dépendre du fuseau du téléphone.
 * Les plages sont semi-ouvertes : `end` est exclu (jour du départ).
 * Les libellés sont écrits à la main : pas de dépendance à Intl sur Hermes.
 */

const DAY_MS = 86_400_000;

export type Day = string;

const WEEKDAYS_SHORT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toUtc(day: Day): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function fromUtc(date: Date): Day {
  return date.toISOString().slice(0, 10);
}

/** Jour local du téléphone. */
export function todayDay(): Day {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(day: Day, days: number): Day {
  return fromUtc(new Date(toUtc(day).getTime() + days * DAY_MS));
}

/** Nombre de jours de `start` à `end` (exclu). */
export function diffDays(start: Day, end: Day): number {
  return Math.round((toUtc(end).getTime() - toUtc(start).getTime()) / DAY_MS);
}

export function eachDay(start: Day, count: number): Day[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** Lundi de la semaine contenant `day`. */
export function startOfWeek(day: Day): Day {
  return addDays(day, -((toUtc(day).getUTCDay() + 6) % 7));
}

export function startOfMonth(day: Day): Day {
  return `${day.slice(0, 7)}-01`;
}

export function addMonths(day: Day, months: number): Day {
  const d = toUtc(startOfMonth(day));
  d.setUTCMonth(d.getUTCMonth() + months);
  return fromUtc(d);
}

/** Position du jour dans la semaine, lundi = 0. */
export function weekdayIndex(day: Day): number {
  return (toUtc(day).getUTCDay() + 6) % 7;
}

export function isWeekend(day: Day): boolean {
  return weekdayIndex(day) >= 5;
}

export function dayOfMonth(day: Day): number {
  return toUtc(day).getUTCDate();
}

/** Jour local (Date) → `YYYY-MM-DD`, pour les sélecteurs de dates. */
export function dayFromLocalDate(date: Date): Day {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → Date locale à minuit, pour les sélecteurs de dates. */
export function localDateFromDay(day: Day): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** « lun » */
export function formatWeekdayShort(day: Day): string {
  return WEEKDAYS_SHORT[toUtc(day).getUTCDay()];
}

/** « octobre 2026 » */
export function formatMonth(day: Day): string {
  const d = toUtc(day);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** « 19 oct. » */
export function formatShort(day: Day): string {
  const d = toUtc(day);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** « lundi 19 octobre » */
export function formatLong(day: Day): string {
  const d = toUtc(day);
  return `${WEEKDAYS_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** « 19 oct. → 22 oct. » */
export function formatRange(start: Day, end: Day): string {
  return `${formatShort(start)} → ${formatShort(end)}`;
}
