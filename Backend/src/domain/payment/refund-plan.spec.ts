import { checkinPayout, ownerCancelPenalty, paidOf, postPayoutShares, splitRefund, tenantCancelPlan } from './refund-plan';

// 3 nuits à 50 000 F : base 150 000, frais 10 500, total 160 500
const full = paidOf({ totalLocataire: 160500, montantAcompte: 160500, montantPayeCash: 160500, coinsDeduites: 0, montantCommission: 10500 });
// Même séjour en acompte 30 % : 48 150 encaissés, frais 10 500 dedans
const deposit = paidOf({ totalLocataire: 160500, montantAcompte: 48150, montantPayeCash: 48150, coinsDeduites: 0, montantCommission: 10500 });

describe('paidOf', () => {
  it('prend l’acompte et non le prix total', () => {
    expect(deposit.total).toBe(48150);
    expect(deposit.commission).toBe(10500);
  });
  it('sépare argent et coins', () => {
    const p = paidOf({ totalLocataire: 160500, montantAcompte: 160500, montantPayeCash: 150500, coinsDeduites: 10000, montantCommission: 10500 });
    expect(p).toEqual({ total: 160500, cash: 150500, coins: 10000, commission: 10500 });
  });
});

describe('splitRefund', () => {
  it('une réservation payée en coins n’est jamais remboursée en argent', () => {
    const coinsOnly = paidOf({ totalLocataire: 20000, montantAcompte: 20000, montantPayeCash: 0, coinsDeduites: 20000, montantCommission: 1300 });
    expect(splitRefund(coinsOnly, 20000)).toEqual({ cash: 0, coins: 20000 });
  });
  it('ne rembourse jamais plus que ce qui a été payé', () => {
    expect(splitRefund(deposit, 160500)).toEqual({ cash: 48150, coins: 0 });
  });
  it('répartit au prorata argent / coins', () => {
    const mixed = paidOf({ totalLocataire: 100000, montantAcompte: 100000, montantPayeCash: 80000, coinsDeduites: 20000, montantCommission: 6500 });
    expect(splitRefund(mixed, 50000)).toEqual({ cash: 40000, coins: 10000 });
  });
});

describe('tenantCancelPlan', () => {
  it('demande pas encore acceptée : 100 % remboursé', () => {
    expect(tenantCancelPlan(full, { confirmed: false, hoursBeforeCheckin: 2 })).toMatchObject({ refund: 160500, host: 0, paixi: 0 });
  });
  it('plus de 3 jours : tout sauf les frais, gardés par Paixi', () => {
    expect(tenantCancelPlan(full, { confirmed: true, hoursBeforeCheckin: 100 })).toMatchObject({ refund: 150000, host: 0, paixi: 10500 });
  });
  it('entre 24 h et 3 jours avec acompte : 75 % de l’acompte, le reste partagé', () => {
    const plan = tenantCancelPlan(deposit, { confirmed: true, hoursBeforeCheckin: 48 });
    expect(plan.refund).toBe(36113);
    expect(plan.paixi + plan.host + plan.refund).toBe(48150);
    expect(plan.paixi).toBe(10500);
    expect(plan.host).toBe(1537);
  });
  it('moins de 24 h : 50 % de ce qui a été payé, l’hôte reçoit le reste après les frais', () => {
    expect(tenantCancelPlan(full, { confirmed: true, hoursBeforeCheckin: 10 })).toMatchObject({ refund: 80250, paixi: 10500, host: 69750 });
  });
});

describe('ownerCancelPenalty', () => {
  it('suit le barème des CGU', () => {
    expect(ownerCancelPenalty(false, 1)).toBe(0);
    expect(ownerCancelPenalty(true, 100)).toBe(0);
    expect(ownerCancelPenalty(true, 30)).toBe(2500);
    expect(ownerCancelPenalty(true, 5)).toBe(10000);
  });
});

describe('postPayoutShares', () => {
  it('litige après versement : l’hôte rend sa part, Paixi ses frais', () => {
    // Paiement complet, hôte crédité de 150 000 : remboursement total
    expect(postPayoutShares(full, 160500, 150000)).toEqual({ host: 150000, paixi: 10500 });
  });
  it('avec acompte, l’hôte ne rend jamais plus que ce qu’il a reçu', () => {
    const shares = postPayoutShares(deposit, 48150, 37650);
    expect(shares.host).toBe(37650);
    expect(shares.host + shares.paixi).toBe(48150);
  });
});

describe('checkinPayout', () => {
  it('sans remboursement : comme avant (hôte = payé − frais)', () => {
    expect(checkinPayout(full, 0)).toEqual({ host: 150000, paixi: 10500 });
    expect(checkinPayout(deposit, 0)).toEqual({ host: 37650, paixi: 10500 });
  });
  it('après un remboursement partiel, on ne verse que ce qui reste', () => {
    expect(checkinPayout(full, 60500)).toEqual({ host: 89500, paixi: 10500 });
  });
});
