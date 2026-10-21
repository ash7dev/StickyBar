import { addDays, monthStart } from '../calendar/day-range';

/** Périodes proposées sur la page Revenus, toujours alignées sur des mois entiers. */
export const REVENUE_PERIODS = { month: 1, quarter: 3, year: 12 } as const;
export type RevenuePeriod = keyof typeof REVENUE_PERIODS;

/** Nombre de mois de l'historique affiché (graphique et mini-diagrammes). */
export const HISTORY_MONTHS = 12;

export interface MonthWindow {
  /** `YYYY-MM` */
  month: string;
  start: string;
  /** Jour de fin exclu (1er du mois suivant) */
  end: string;
}

export function monthWindow(start: string): MonthWindow {
  return { month: start.slice(0, 7), start, end: monthStart(start, 1) };
}

/** Les `count` mois se terminant par le mois de `today` (inclus), du plus ancien au plus récent. */
export function lastMonths(today: string, count: number, offsetMonths = 0): MonthWindow[] {
  return Array.from({ length: count }, (_, i) => monthWindow(monthStart(today, offsetMonths - (count - 1 - i))));
}

/** Mois de la période choisie, et ceux de la période précédente de même durée. */
export function periodMonths(period: RevenuePeriod, today: string) {
  const length = REVENUE_PERIODS[period];
  return {
    current: lastMonths(today, length),
    previous: lastMonths(today, length, -length),
  };
}

/** Dernier jour inclus d'une fenêtre (pour les libellés). */
export function lastDay(window: { end: string }): string {
  return addDays(window.end, -1);
}
