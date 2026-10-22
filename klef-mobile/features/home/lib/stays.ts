/** Réservation telle que renvoyée par GET /reservations/me (côté voyageur). */
export interface MyReservation {
  id: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  closeLe?: string | null;
  montantSoldeRestant?: number | string | null;
  typePaiement?: string | null;
  logement?: { id: string; titre: string; ville?: string | null; quartier?: string | null; photos?: Array<{ url: string }> } | null;
  proprietaire?: { prenom?: string | null; telephone?: string | null } | null;
  avis?: Array<{ auteurId: string }>;
}

export type HomeMode =
  | { kind: 'stay'; res: MyReservation; inStay: boolean } // séjour dans 3 jours ou moins, ou en cours
  | { kind: 'after'; res: MyReservation } // séjour terminé, pas encore noté (7 jours)
  | { kind: 'regular'; upcoming?: MyReservation } // accueil normal, avec la carte d'un séjour plus lointain
  | { kind: 'first' }; // première ouverture : la fenêtre et la question

const DAY = 86_400_000;
/** Le compte à rebours prend toute la fenêtre à partir de 3 jours avant l'arrivée. */
export const IMMERSIVE_BEFORE_MS = 3 * DAY;
const REVIEW_WINDOW_MS = 7 * DAY;

export function homeMode(reservations: MyReservation[], userId: string | undefined, returning: boolean, now = new Date()): HomeMode {
  const t = now.getTime();
  const inStay = reservations.find((r) => r.statut === 'CHECKED_IN');
  if (inStay) return { kind: 'stay', res: inStay, inStay: true };

  const upcoming = reservations
    .filter((r) => ['PAID', 'CONFIRMED'].includes(r.statut) && new Date(r.dateDebut).getTime() > t - DAY)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))[0];
  if (upcoming && new Date(upcoming.dateDebut).getTime() - t <= IMMERSIVE_BEFORE_MS) return { kind: 'stay', res: upcoming, inStay: false };

  const toRate = reservations.find(
    (r) =>
      r.statut === 'COMPLETED' &&
      r.closeLe &&
      t - new Date(r.closeLe).getTime() < REVIEW_WINDOW_MS &&
      !(r.avis ?? []).some((a) => a.auteurId === userId),
  );
  if (toRate) return { kind: 'after', res: toRate };

  if (upcoming || returning) return { kind: 'regular', upcoming };
  return { kind: 'first' };
}

/** { j, h, min } jusqu'à une date. */
export function countdown(iso: string, now = new Date()) {
  const ms = Math.max(0, new Date(iso).getTime() - now.getTime());
  const min = Math.floor(ms / 60_000);
  return { d: Math.floor(min / 1440), h: Math.floor((min % 1440) / 60), m: min % 60 };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function reviewDaysLeft(r: MyReservation, now = new Date()): number {
  if (!r.closeLe) return 7;
  return Math.max(1, Math.ceil((new Date(r.closeLe).getTime() + REVIEW_WINDOW_MS - now.getTime()) / DAY));
}
