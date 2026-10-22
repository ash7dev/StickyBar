import type { ManagerReservation } from '../hooks/useManagerToday';

/**
 * Chiffres du cockpit, calculés à partir des mêmes réservations que la tournée et les
 * tâches : ils suivent instantanément le filtre propriétaire, sans aller-retour serveur.
 * Une réservation compte dans le mois où elle a été faite (comme l'espace gestionnaire web).
 */
const ACTIVE = new Set(['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED']);
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export interface ManagerMoney {
  /** Total payé par les voyageurs pour les réservations du mois */
  revenue: number;
  ownersShare: number;
  commission: number;
  stays: number;
  /** 6 derniers mois, du plus ancien au mois en cours */
  bars: Array<{ month: string; label: string; value: number }>;
  /** Évolution par rapport au mois précédent, null si le mois précédent est vide */
  changePct: number | null;
}

export function computeMoney(reservations: ManagerReservation[], now = new Date()): ManagerMoney {
  const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  const totals = new Map(months.map((m) => [m, 0]));
  let revenue = 0;
  let ownersShare = 0;
  let commission = 0;
  let stays = 0;
  const current = months[months.length - 1];

  for (const r of reservations) {
    if (!ACTIVE.has(r.statut) || !r.creeLe) continue;
    const m = r.creeLe.slice(0, 7);
    if (!totals.has(m)) continue;
    const total = Number(r.totalLocataire ?? 0);
    totals.set(m, (totals.get(m) ?? 0) + total);
    if (m === current) {
      revenue += total;
      ownersShare += Number(r.netProprietaire ?? 0);
      commission += Number(r.montantCommission ?? 0);
      stays += 1;
    }
  }

  const values = months.map((m) => totals.get(m) ?? 0);
  const prev = values[values.length - 2];
  return {
    revenue,
    ownersShare,
    commission,
    stays,
    bars: months.map((m, i) => ({ month: m, label: MONTHS_SHORT[Number(m.slice(5, 7)) - 1], value: values[i] })),
    changePct: prev > 0 ? Math.round(((revenue - prev) / prev) * 100) : null,
  };
}
