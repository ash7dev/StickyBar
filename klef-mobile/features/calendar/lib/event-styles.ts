import { colors } from '../../../shared/theme/tokens';
import type { OwnerCalendarEvent, StatutReservation } from '../types';

export type CalendarStatus = StatutReservation | 'BLOCK';

interface StatusStyle {
  label: string;
  background: string;
  text: string;
  border?: string;
  dashed?: boolean;
}

/* Palette Paixi uniquement — mêmes choix que le calendrier web. */
export const STATUS_STYLES: Record<CalendarStatus, StatusStyle> = {
  PAID: { label: 'À décider', background: colors.gold[400], text: colors.gold[800] },
  PENDING: {
    label: 'Paiement en attente',
    background: colors.warning[50],
    text: colors.warning[700],
    border: colors.warning[500],
    dashed: true,
  },
  CONFIRMED: { label: 'Confirmée', background: colors.forest[600], text: colors.neutral[0] },
  CHECKED_IN: { label: 'En séjour', background: colors.success[600], text: colors.neutral[0] },
  COMPLETED: { label: 'Terminée', background: colors.forest[100], text: colors.forest[800] },
  DISPUTED: { label: 'Litige', background: colors.error[500], text: colors.neutral[0] },
  CANCELLED: { label: 'Annulée', background: colors.neutral[200], text: colors.neutral[600] },
  EXPIRED: { label: 'Expirée', background: colors.neutral[200], text: colors.neutral[600] },
  BLOCK: {
    label: 'Bloqué',
    background: colors.neutral[100],
    text: colors.neutral[700],
    border: colors.neutral[300],
    dashed: true,
  },
};

export const LEGEND: CalendarStatus[] = ['PAID', 'CONFIRMED', 'CHECKED_IN', 'BLOCK'];

/** Réservations qui occupent le logement (même règle que l'API). */
export const OCCUPYING_STATUSES: ReadonlySet<StatutReservation> = new Set([
  'PENDING',
  'PAID',
  'CONFIRMED',
  'CHECKED_IN',
]);

export function eventStatus(event: OwnerCalendarEvent): CalendarStatus {
  return event.kind === 'BLOCK' ? 'BLOCK' : event.statut;
}

export function eventLabel(event: OwnerCalendarEvent): string {
  if (event.kind === 'BLOCK') return event.motif || 'Bloqué';
  return `${event.locataire.prenom} ${event.locataire.nomInitiale}`.trim();
}

/** La plage [start, end) contient-elle une nuit occupée par une réservation ? */
export function overlapsReservation(
  events: OwnerCalendarEvent[],
  logementId: string,
  start: string,
  end: string,
): boolean {
  return events.some(
    (e) =>
      e.kind === 'RESERVATION' &&
      e.logementId === logementId &&
      OCCUPYING_STATUSES.has(e.statut) &&
      e.start < end &&
      e.end > start,
  );
}
