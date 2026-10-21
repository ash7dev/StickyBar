import type { ReservationDetail } from '../../types/reservation-detail.types';

/**
 * Étape du séjour côté locataire : chaque réservation tombe sur UNE étape,
 * qui décide de la carte « Maintenant », des blocs affichés et de la barre du bas.
 * Mêmes règles que l'ancienne barre d'actions (litige prioritaire, tolérance 30 min).
 */
export type TenantStage =
  | 'payment-pending'
  | 'awaiting-host'
  | 'confirmed'
  | 'day-waiting'
  | 'host-absent'
  | 'absent-reported'
  | 'checkin-ready'
  | 'in-stay'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'expired';

/** Délai après l'heure d'arrivée avant de pouvoir signaler l'hôte absent. */
export const ABSENCE_TOLERANCE_MS = 30 * 60 * 1000;

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function tenantStage(res: ReservationDetail, now: Date = new Date()): TenantStage {
  const disputeActive = res.statut === 'DISPUTED' || res.litige?.statut === 'EN_ATTENTE';
  if (disputeActive) return 'disputed';
  if (res.statut === 'CANCELLED') return 'cancelled';
  if (res.statut === 'EXPIRED') return 'expired';
  if (res.checkinLocataireLe) return res.statut === 'COMPLETED' ? 'completed' : 'in-stay';
  if (res.statut === 'COMPLETED') return 'completed';
  if (res.statut === 'PENDING') return 'payment-pending';
  if (res.statut === 'PAID') return 'awaiting-host';

  // CONFIRMED / CHECKED_IN : avant le jour J, puis les sous-états du jour J
  const start = new Date(res.dateDebut);
  if (now < start && !sameLocalDay(now, start)) return 'confirmed';
  if (res.checkinProprioLe) return 'checkin-ready';
  const hasPhotos = (res.photosEtatLieu ?? []).some((p) => p.type === 'CHECKIN');
  if (!hasPhotos && now.getTime() > start.getTime() + ABSENCE_TOLERANCE_MS) {
    return res.absenceSignaleeLe ? 'absent-reported' : 'host-absent';
  }
  return 'day-waiting';
}

/** Le numéro de l'hôte n'est montré qu'à partir de 24 h avant l'arrivée. */
export function hostPhoneUnlocked(res: ReservationDetail, now: Date = new Date()): boolean {
  return new Date(res.dateDebut).getTime() - now.getTime() <= 24 * 3_600_000;
}


/** Fenêtre pour noter l'autre partie après la clôture (refusé ensuite par l'API). */
export const REVIEW_WINDOW_DAYS = 7;

/** Jours restants pour laisser un avis (null si fermé). */
export function reviewDaysLeft(res: ReservationDetail, now: Date = new Date()): number | null {
  if (!res.closeLe) return REVIEW_WINDOW_DAYS;
  const left = Math.ceil((new Date(res.closeLe).getTime() + REVIEW_WINDOW_DAYS * 86_400_000 - now.getTime()) / 86_400_000);
  return left > 0 ? left : null;
}

/** « 31 h », « 2 h 10 », « 45 min » jusqu'à une échéance ISO. */
export function timeLeft(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms <= 0) return null;
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return h >= 10 ? `${h} h` : `${h} h${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}`;
}

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** « 24 oct. » */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** « mardi 27 oct. » */
export function longDate(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** « 14:05 » */
export function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Heure d'arrivée lisible : « 14h » à partir de « 14:00 » (défaut serveur). */
export function hourLabel(hhmm: string | null | undefined, fallback: string): string {
  if (!hhmm) return fallback;
  const [h, m] = hhmm.split(':');
  return m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`;
}

/**
 * Heures d'arrivée et de départ. L'API ne stocke pas d'heures à part : à la confirmation,
 * l'hôte les applique directement à dateDebut / dateFin (confirm-reservation).
 */
export function stayHours(res: ReservationDetail): { arrival: string; departure: string } {
  if (!res.confirmeeLe) return { arrival: '14h', departure: '12h' };
  return { arrival: hourLabel(clock(res.dateDebut), '14h'), departure: hourLabel(clock(res.dateFin), '12h') };
}

/** Montant de l'acompte quand la réservation est en « acompte + solde le jour J ». */
export function depositSplit(res: ReservationDetail): { paid: number; balance: number } | null {
  const balance = Number(res.montantSoldeRestant ?? 0);
  const deposit = Number(res.montantAcompte ?? 0);
  if (!deposit || !balance) return null;
  return { paid: deposit, balance };
}
