/**
 * Contrat de GET /dashboard/owner/calendar (identique au web : lib/nestjs/types.ts).
 * Jours `YYYY-MM-DD`, plages semi-ouvertes (`end` exclu).
 */

export type StatutReservation =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'EXPIRED';

export interface OwnerCalendarLogement {
  id: string;
  titre: string;
  ville: string;
  statut: string;
  prixBase: number;
  photoUrl: string | null;
}

export interface OwnerCalendarReservationEvent {
  kind: 'RESERVATION';
  id: string;
  logementId: string;
  start: string;
  end: string;
  statut: StatutReservation;
  nbNuits: number;
  nbPersonnes: number;
  netProprietaire: number;
  /** Formule acompte : solde à encaisser sur place (0 si tout est payé en ligne). */
  soldeSurPlace?: number;
  /** « 14:00 » / « 12:00 » */
  heureArrivee?: string;
  heureDepart?: string;
  locataire: { prenom: string; nomInitiale: string; avatarUrl: string | null };
}

export interface OwnerCalendarBlockEvent {
  kind: 'BLOCK';
  id: string;
  logementId: string;
  start: string;
  end: string;
  motif: string | null;
}

export type OwnerCalendarEvent = OwnerCalendarReservationEvent | OwnerCalendarBlockEvent;

export interface OwnerCalendarResponse {
  range: { start: string; end: string };
  logements: OwnerCalendarLogement[];
  events: OwnerCalendarEvent[];
}

export interface CreateOwnerBlockPayload {
  logementIds: string[];
  dateDebut: string;
  /** Jour de fin exclu */
  dateFin: string;
  motif?: string;
}

/** Brouillon de blocage (sélection sur le calendrier) — `end` exclu. */
export interface BlockDraft {
  logementIds: string[];
  start: string;
  end: string;
}
