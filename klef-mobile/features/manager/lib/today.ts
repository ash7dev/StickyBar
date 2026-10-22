import type { ManagedLead, ManagedListing, ManagerReservation } from '../hooks/useManagerToday';

/**
 * La journée du gestionnaire, calculée à partir des réservations du parc.
 * Dakar est à UTC : le jour et l'heure se lisent directement dans les dates ISO.
 */

export const dayOf = (iso: string) => iso.slice(0, 10);
export const hourOf = (iso: string) => iso.slice(11, 16);
export const todayKey = (now = new Date()) => now.toISOString().slice(0, 10);
export const nowHour = (now = new Date()) => now.toISOString().slice(11, 16);

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const weekdayShort = (day: string) => WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
export const weekdayLong = (day: string) => WEEKDAYS_LONG[new Date(`${day}T00:00:00Z`).getUTCDay()];
export const dayNumber = (day: string) => String(new Date(`${day}T00:00:00Z`).getUTCDate());
export const longDay = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  return `${WEEKDAYS_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

const STAY = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED']);

export interface Move {
  key: string;
  kind: 'ARRIVAL' | 'DEPARTURE';
  at: string; // HH:mm
  day: string;
  done: boolean;
  reservation: ManagerReservation;
  listing?: ManagedListing;
  ownerName: string;
  /** Arrivée sans état des lieux d'entrée de l'hôte, ou départ sans état des lieux de sortie. */
  needsInspection: boolean;
  /** Formule acompte : solde à encaisser sur place à l'arrivée (0 sinon). */
  cash: number;
}

export const ownerNameOf = (l?: ManagedListing) =>
  l?.proprietaire ? `${l.proprietaire.prenom} ${l.proprietaire.nom}`.trim() : 'Propriétaire';

export const guestName = (r: ManagerReservation) => {
  const p = r.locataire?.prenom ? r.locataire.prenom.charAt(0).toUpperCase() + r.locataire.prenom.slice(1).toLowerCase() : 'Voyageur';
  return r.locataire?.nom ? `${p} ${r.locataire.nom.charAt(0).toUpperCase()}.` : p;
};

export function buildMoves(reservations: ManagerReservation[], listings: Map<string, ManagedListing>, day: string): Move[] {
  const moves: Move[] = [];
  for (const r of reservations) {
    if (!STAY.has(r.statut)) continue;
    const listing = listings.get(r.logementId);
    const ownerName = ownerNameOf(listing);
    if (dayOf(r.dateDebut) === day && r.statut !== 'COMPLETED') {
      const done = r.statut === 'CHECKED_IN' || !!r.checkinLocataireLe;
      const cash = r.typePaiement?.toUpperCase() === 'DEPOSIT' ? Number(r.montantSoldeRestant ?? 0) : 0;
      moves.push({
        key: `a-${r.id}`,
        kind: 'ARRIVAL',
        at: hourOf(r.dateDebut),
        day,
        done,
        reservation: r,
        listing,
        ownerName,
        needsInspection: !done && !r.checkinProprioLe,
        cash: done ? 0 : cash,
      });
    }
    if (dayOf(r.dateFin) === day) {
      const done = r.statut === 'COMPLETED' || !!r.checkoutProprioLe;
      moves.push({
        key: `d-${r.id}`,
        kind: 'DEPARTURE',
        at: hourOf(r.dateFin),
        day,
        done,
        reservation: r,
        listing,
        ownerName,
        needsInspection: !done && r.statut === 'CHECKED_IN',
        cash: 0,
      });
    }
  }
  return moves.sort((a, b) => a.at.localeCompare(b.at) || (a.kind === 'DEPARTURE' ? -1 : 1));
}

// ── Les tâches « À faire maintenant » ────────────────────────────────────────

export type TaskKind = 'DECISION' | 'INSPECTION_IN' | 'INSPECTION_OUT' | 'CASH' | 'LEAD';

export interface Task {
  key: string;
  kind: TaskKind;
  /** Pour l'ordre : plus petit = plus urgent */
  rank: string;
  kicker: string;
  title: string;
  sub: string;
  reservationId?: string;
  lead?: ManagedLead;
  /** Pour l'affichage compact des tuiles */
  short: string;
  at?: string;
  amount?: number;
}

export function buildTasks(
  decisions: ManagerReservation[],
  todayMoves: Move[],
  leads: ManagedLead[],
  listings: Map<string, ManagedListing>,
  expiry: (iso: string) => string,
): Task[] {
  const tasks: Task[] = [];
  for (const r of decisions) {
    const l = listings.get(r.logementId);
    const total = Number(r.totalLocataire ?? 0);
    tasks.push({
      key: `dec-${r.id}`,
      kind: 'DECISION',
      rank: `0-${r.delaiConfirmation ?? ''}`,
      kicker: r.delaiConfirmation ? `DEMANDE · ${expiry(r.delaiConfirmation).toUpperCase()}` : 'DEMANDE À DÉCIDER',
      title: `${guestName(r)} veut ${l?.titre ?? r.logement?.titre ?? 'un bien'}`,
      sub: `${r.nbNuits} nuit${r.nbNuits > 1 ? 's' : ''}${total ? ` · ${fmt(total)} FCFA` : ''} · pour ${ownerNameOf(l)}`,
      reservationId: r.id,
      short: l?.titre ?? 'Demande',
      at: r.delaiConfirmation ?? undefined,
    });
  }
  for (const m of todayMoves) {
    if (m.needsInspection) {
      const arrival = m.kind === 'ARRIVAL';
      tasks.push({
        key: `edl-${m.key}`,
        kind: arrival ? 'INSPECTION_IN' : 'INSPECTION_OUT',
        rank: `1-${m.at}`,
        kicker: arrival ? `ÉTAT DES LIEUX · AVANT ${m.at}` : `ÉTAT DES LIEUX DE SORTIE · ${m.at}`,
        title: `${m.listing?.titre ?? 'Logement'}, ${arrival ? 'entrée' : 'sortie'} de ${guestName(m.reservation)}`,
        sub: `pour ${m.ownerName}`,
        reservationId: m.reservation.id,
        short: m.listing?.titre ?? 'Logement',
        at: m.at,
      });
    }
    if (m.cash > 0) {
      tasks.push({
        key: `cash-${m.key}`,
        kind: 'CASH',
        rank: `2-${m.at}`,
        kicker: `SOLDE À ENCAISSER · ${m.at}`,
        title: `${fmt(m.cash)} FCFA de ${guestName(m.reservation)}`,
        sub: `${m.listing?.titre ?? 'Logement'} · formule acompte`,
        reservationId: m.reservation.id,
        short: guestName(m.reservation),
        at: m.at,
        amount: m.cash,
      });
    }
  }
  for (const lead of leads) {
    tasks.push({
      key: `lead-${lead.id}`,
      kind: 'LEAD',
      rank: `3-${lead.creeLe}`,
      kicker: 'PROSPECT PAIXI MANAGED · NOUVEAU',
      title: `${lead.prenom} ${lead.nom.charAt(0).toUpperCase()}.${lead.typeBien ? ` · ${lead.typeBien.toLowerCase()}` : ''}${lead.ville ? ` à ${lead.ville}` : ''}`,
      sub: `${lead.nombreLogements ?? 1} logement${(lead.nombreLogements ?? 1) > 1 ? 's' : ''} à confier · à rappeler`,
      lead,
      short: `${lead.prenom} ${lead.nom.charAt(0).toUpperCase()}.`,
    });
  }
  return tasks.sort((a, b) => a.rank.localeCompare(b.rank));
}

export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Numéro pour WhatsApp (indicatif Sénégal ajouté si absent). */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('221') ? digits : `221${digits}`;
}
