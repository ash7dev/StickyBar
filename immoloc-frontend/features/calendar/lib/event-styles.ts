import type { OwnerCalendarEvent } from '@/lib/nestjs';
import type { StatutReservation } from '@/lib/nestjs/types';

type CalendarStatus = StatutReservation | 'BLOCK';

interface StatusMeta {
  label: string;
  /** Barre sur la timeline */
  bar: string;
  /** Pastille de légende / badge */
  dot: string;
}

/* Palette Paixi uniquement (forest / gold / success / warning / error / neutral). */
export const STATUS_META: Record<CalendarStatus, StatusMeta> = {
  PAID: {
    label: 'À décider',
    bar: 'bg-gold-400 text-gold-800 ring-2 ring-gold-500/40',
    dot: 'bg-gold-400',
  },
  PENDING: {
    label: 'Paiement en attente',
    bar: 'bg-warning-50 text-warning-700 border border-dashed border-warning-500',
    dot: 'bg-warning-500',
  },
  CONFIRMED: {
    label: 'Confirmée',
    bar: 'bg-forest-600 text-white',
    dot: 'bg-forest-600',
  },
  CHECKED_IN: {
    label: 'En séjour',
    bar: 'bg-success-600 text-white',
    dot: 'bg-success-600',
  },
  COMPLETED: {
    label: 'Terminée',
    bar: 'bg-forest-100 text-forest-800',
    dot: 'bg-forest-200',
  },
  DISPUTED: {
    label: 'Litige',
    bar: 'bg-error-500 text-white',
    dot: 'bg-error-500',
  },
  CANCELLED: { label: 'Annulée', bar: 'bg-neutral-200 text-neutral-600', dot: 'bg-neutral-300' },
  EXPIRED: { label: 'Expirée', bar: 'bg-neutral-200 text-neutral-600', dot: 'bg-neutral-300' },
  BLOCK: {
    label: 'Bloqué',
    bar: 'calendar-block-stripes border border-neutral-300 text-neutral-700',
    dot: 'calendar-block-stripes border border-neutral-300',
  },
};

/** Ordre d'affichage de la légende. */
export const LEGEND_ORDER: CalendarStatus[] = ['PAID', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'BLOCK'];

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
