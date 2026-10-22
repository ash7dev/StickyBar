import type { ManagedListing, ManagerReservation } from '../hooks/useManagerToday';
import { addDays, dayOf, guestName, hourOf, weekdayLong } from './today';

/** Ce qui se passe ce soir dans un bien, du point de vue du gestionnaire. */
export type TonightState = 'ARRIVAL' | 'DEPARTURE' | 'OCCUPIED' | 'FREE' | 'OFFLINE';

export interface ListingDay {
  state: TonightState;
  line: string;
  /** Nuits libres sur les 7 prochains jours (pour suggérer la dernière minute) */
  freeNights: number;
}

const OCCUPYING = new Set(['PAID', 'CONFIRMED', 'CHECKED_IN']);
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const short = (day: string) => `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1]}`;

export const OFFLINE_LABEL: Record<string, string> = {
  PAUSED: 'En pause',
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En révision',
  REJECTED: 'À corriger',
};

export function listingDay(l: ManagedListing, reservations: ManagerReservation[], today: string): ListingDay {
  const stays = reservations
    .filter((r) => r.logementId === l.id && OCCUPYING.has(r.statut))
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));

  // Nuits libres sur 7 jours : une nuit est occupée si un séjour la couvre
  let freeNights = 0;
  for (let i = 0; i < 7; i++) {
    const night = addDays(today, i);
    if (!stays.some((r) => dayOf(r.dateDebut) <= night && night < dayOf(r.dateFin))) freeNights++;
  }

  if (l.statut !== 'PUBLISHED') {
    return { state: 'OFFLINE', line: OFFLINE_LABEL[l.statut] ?? 'Hors ligne', freeNights };
  }
  const arriving = stays.find((r) => dayOf(r.dateDebut) === today);
  if (arriving) return { state: 'ARRIVAL', line: `${guestName(arriving)} arrive à ${hourOf(arriving.dateDebut)}`, freeNights };
  const staying = stays.find((r) => dayOf(r.dateDebut) < today && today < dayOf(r.dateFin));
  if (staying) return { state: 'OCCUPIED', line: `${guestName(staying)} · départ ${weekdayLong(dayOf(staying.dateFin))}`, freeNights };
  const leaving = stays.find((r) => dayOf(r.dateFin) === today);
  if (leaving) return { state: 'DEPARTURE', line: `${guestName(leaving)} part à ${hourOf(leaving.dateFin)}`, freeNights };
  const next = stays.find((r) => dayOf(r.dateDebut) > today);
  return { state: 'FREE', line: next ? `Libre jusqu’au ${short(dayOf(next.dateDebut))}` : 'Libre, aucune réservation à venir', freeNights };
}
