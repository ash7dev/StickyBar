import type { ReservationDetail } from '../../types/reservation-detail.types';

/**
 * Étape du séjour côté hôte : une réservation tombe sur UNE étape, qui décide
 * de la carte « Maintenant », des blocs affichés et de la barre du bas.
 * Les délais sont ceux de l'API (checkin-proprio, signal-noshow, tenant-noshow.job…).
 */
export type OwnerStage =
  | 'payment-pending'
  | 'to-decide'
  | 'confirmed'
  | 'checkin-open'
  | 'host-absent-reported'
  | 'awaiting-guest'
  | 'guest-late'
  | 'noshow-signaled'
  | 'in-stay'
  | 'departure'
  | 'completed'
  | 'noshow-closed'
  | 'disputed'
  | 'cancelled'
  | 'expired';

const HOUR = 3_600_000;
/** L'état des lieux d'entrée s'ouvre 4 h avant l'arrivée (checkin-proprio). */
export const CHECKIN_WINDOW_MS = 4 * HOUR;
/** Le no-show se signale à partir de 2 h après l'heure d'arrivée (signal-noshow). */
export const NOSHOW_AFTER_MS = 2 * HOUR;
/** Le job tenant-noshow clôture 15 min après le signalement. */
export const NOSHOW_CLOSE_MS = 15 * 60_000;
/** L'hôte signalé absent a 2 h pour faire l'état des lieux. */
export const HOST_ABSENCE_GRACE_MS = 2 * HOUR;
/** Le séjour démarre seul 6 h après l'arrivée, ou après un état des lieux tardif (auto-checkin). */
export const AUTO_CHECKIN_MS = 6 * HOUR;

/** Heure du démarrage automatique ; null tant que l'hôte n'a pas fait l'état des lieux d'entrée. */
export function autoCheckinAt(res: ReservationDetail): string | null {
  if (!res.checkinProprioLe) return null;
  const from = Math.max(new Date(res.dateDebut).getTime(), new Date(res.checkinProprioLe).getTime());
  return new Date(from + AUTO_CHECKIN_MS).toISOString();
}
/** L'état des lieux de sortie s'ouvre 4 h avant le départ (checkout-proprio). */
export const CHECKOUT_WINDOW_MS = 4 * HOUR;
/** Litige possible jusqu'à 24 h après la clôture (disputes.service). */
export const DISPUTE_WINDOW_MS = 24 * HOUR;

export const NOSHOW_SIGNAL = 'OWNER_SIGNAL_TENANT_NOSHOW';

/** Date du signalement de no-show par l'hôte, s'il y en a un. */
export function noshowSignaledAt(res: ReservationDetail): string | null {
  const e = (res.historique ?? []).find((h) => h.modifiePar === NOSHOW_SIGNAL);
  return e?.modifieLe ?? null;
}

export function ownerStage(res: ReservationDetail, now: Date = new Date()): OwnerStage {
  if (res.statut === 'DISPUTED' || res.litige?.statut === 'EN_ATTENTE') return 'disputed';
  if (res.statut === 'CANCELLED') return 'cancelled';
  if (res.statut === 'EXPIRED') return 'expired';
  if (res.statut === 'COMPLETED') return res.politiqueAppliquee === 'NO_SHOW_LOCATAIRE' ? 'noshow-closed' : 'completed';
  if (res.statut === 'PENDING') return 'payment-pending';
  if (res.statut === 'PAID') return 'to-decide';

  const t = now.getTime();
  const start = new Date(res.dateDebut).getTime();
  const end = new Date(res.dateFin).getTime();

  if (res.statut === 'CHECKED_IN' || res.checkinLocataireLe) {
    return t >= end - CHECKOUT_WINDOW_MS ? 'departure' : 'in-stay';
  }

  // CONFIRMED : avant le jour J, puis les sous-états de l'arrivée
  if (noshowSignaledAt(res)) return 'noshow-signaled';
  if (res.absenceSignaleeLe && !res.checkinProprioLe) return 'host-absent-reported';
  if (t >= start + NOSHOW_AFTER_MS) return 'guest-late';
  if (res.checkinProprioLe) return 'awaiting-guest';
  if (t >= start - CHECKIN_WINDOW_MS) return 'checkin-open';
  return 'confirmed';
}

/** Les numéros s'échangent 24 h avant l'arrivée. */
export function guestPhoneUnlocked(res: ReservationDetail, now: Date = new Date()): boolean {
  return new Date(res.dateDebut).getTime() - now.getTime() <= 24 * HOUR;
}

/** Ce que l'hôte touche via Paixi : acompte moins commission en formule acompte (credit-wallet). */
export function hostPayout(res: ReservationDetail): number {
  if (res.typePaiement?.toUpperCase() === 'DEPOSIT') {
    return Math.max(0, Number(res.montantAcompte ?? 0) - Number(res.montantCommission ?? 0));
  }
  return Number(res.netProprietaire ?? 0);
}

/** Solde à encaisser en main propre (formule acompte), sinon null. */
export function cashBalance(res: ReservationDetail): number | null {
  if (res.typePaiement?.toUpperCase() !== 'DEPOSIT') return null;
  const b = Number(res.montantSoldeRestant ?? 0);
  return b > 0 ? b : null;
}

/** Pénalité d'annulation hôte selon le délai avant l'arrivée (cancel-reservation). */
export function ownerCancelPenalty(res: ReservationDetail, now: Date = new Date()): { amount: number; tier: 0 | 1 | 2 } {
  const ms = new Date(res.dateDebut).getTime() - now.getTime();
  if (ms > 3 * 24 * HOUR) return { amount: 0, tier: 0 };
  if (ms >= 24 * HOUR) return { amount: 2500, tier: 1 };
  return { amount: 10000, tier: 2 };
}

export function disputeOpen(res: ReservationDetail, now: Date = new Date()): boolean {
  if (res.statut === 'COMPLETED') {
    return !!res.closeLe && now.getTime() <= new Date(res.closeLe).getTime() + DISPUTE_WINDOW_MS;
  }
  return res.statut === 'CONFIRMED' || res.statut === 'CHECKED_IN';
}

/** ISO + n millisecondes. */
export const plus = (iso: string, ms: number) => new Date(new Date(iso).getTime() + ms).toISOString();
