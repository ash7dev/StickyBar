/**
 * Règles d'argent d'une réservation, calculées sur ce que le voyageur a RÉELLEMENT payé
 * (acompte ou totalité, part en argent, part en Paixi Coins) et jamais sur le prix total.
 * Fonctions pures : pas de base de données, testées dans refund-plan.spec.ts.
 */

type Num = number | string | { toString(): string } | null | undefined;
const n = (v: Num) => Number(v ?? 0) || 0;

export interface PaidSource {
  totalLocataire: Num;
  montantAcompte: Num;
  montantPayeCash: Num;
  coinsDeduites: Num;
  montantCommission: Num;
}

export interface Paid {
  /** Montant encaissé par Paixi (argent + coins) : acompte ou totalité. */
  total: number;
  cash: number;
  coins: number;
  /** Frais de service Paixi contenus dans ce montant. */
  commission: number;
}

export function paidOf(r: PaidSource): Paid {
  const total = n(r.montantAcompte) || n(r.totalLocataire);
  const coins = Math.min(n(r.coinsDeduites), total);
  return { total, cash: total - coins, coins, commission: Math.min(n(r.montantCommission), total) };
}

/** Répartit un remboursement entre argent et coins, au prorata de ce qui a été payé. */
export function splitRefund(paid: Paid, amount: number): { cash: number; coins: number } {
  const refund = Math.max(0, Math.min(Math.round(amount), paid.total));
  if (paid.total <= 0 || refund === 0) return { cash: 0, coins: 0 };
  const coins = Math.round((refund * paid.coins) / paid.total);
  return { cash: refund - coins, coins };
}

/** Part retenue (non remboursée) : Paixi garde d'abord ses frais, l'hôte reçoit le reste. */
export function retainedSplit(paid: Paid, refund: number): { host: number; paixi: number } {
  const retained = Math.max(0, paid.total - refund);
  const paixi = Math.min(paid.commission, retained);
  return { host: retained - paixi, paixi };
}

export type TenantCancelPolicy =
  | 'UC1_LOCATAIRE_NON_CONFIRMEE'
  | 'UC2_LOCATAIRE_PLUS_3J'
  | 'UC2_LOCATAIRE_1_3J'
  | 'UC2_LOCATAIRE_BLOQUE';

/**
 * Annulation par le voyageur :
 * - demande pas encore acceptée par l'hôte → 100 % de ce qu'il a payé ;
 * - plus de 3 jours avant → tout sauf les frais de service ;
 * - entre 24 h et 3 jours → 75 % de ce qu'il a payé ;
 * - moins de 24 h → 50 % de ce qu'il a payé.
 */
export function tenantCancelPlan(
  paid: Paid,
  { confirmed, hoursBeforeCheckin }: { confirmed: boolean; hoursBeforeCheckin: number },
): { policy: TenantCancelPolicy; refund: number; host: number; paixi: number } {
  let policy: TenantCancelPolicy;
  let refund: number;
  if (!confirmed) {
    policy = 'UC1_LOCATAIRE_NON_CONFIRMEE';
    refund = paid.total;
  } else if (hoursBeforeCheckin > 72) {
    policy = 'UC2_LOCATAIRE_PLUS_3J';
    refund = paid.total - paid.commission;
  } else if (hoursBeforeCheckin >= 24) {
    policy = 'UC2_LOCATAIRE_1_3J';
    refund = Math.round(paid.total * 0.75);
  } else {
    policy = 'UC2_LOCATAIRE_BLOQUE';
    refund = Math.round(paid.total * 0.5);
  }
  return { policy, refund, ...retainedSplit(paid, refund) };
}

/** Pénalité forfaitaire de l'hôte qui annule une réservation confirmée (CGU, article 8). */
export function ownerCancelPenalty(confirmed: boolean, hoursBeforeCheckin: number): number {
  if (!confirmed || hoursBeforeCheckin > 72) return 0;
  return hoursBeforeCheckin >= 24 ? 2500 : 10000;
}

/**
 * Remboursement décidé après le versement à l'hôte (litige fondé) :
 * l'hôte rend sa part au prorata de ce qu'il a reçu, Paixi rend le reste (ses frais).
 */
export function postPayoutShares(paid: Paid, refund: number, hostCredited: number): { host: number; paixi: number } {
  const amount = Math.max(0, Math.min(Math.round(refund), paid.total));
  if (paid.total <= 0) return { host: 0, paixi: 0 };
  const host = Math.min(hostCredited, Math.round((amount * hostCredited) / paid.total));
  return { host, paixi: amount - host };
}

/**
 * Versement à l'hôte au check-in : ce qui reste après d'éventuels remboursements partiels,
 * moins les frais Paixi (prélevés en premier).
 */
export function checkinPayout(paid: Paid, alreadyRefunded: number): { host: number; paixi: number } {
  const available = Math.max(0, paid.total - alreadyRefunded);
  const paixi = Math.min(paid.commission, available);
  return { host: available - paixi, paixi };
}
