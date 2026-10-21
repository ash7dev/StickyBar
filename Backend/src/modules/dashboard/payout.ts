/**
 * Montant libéré dans le wallet du propriétaire au check-in
 * (même calcul que CreditWalletUseCase, avant déduction d'une éventuelle dette) :
 * paiement complet → revenu net ; acompte → acompte moins la commission Paixi.
 */
export function payoutAmount(r: {
  typePaiement: string;
  netProprietaire: unknown;
  montantAcompte: unknown;
  montantCommission: unknown;
}): number {
  if (r.typePaiement?.toUpperCase() === 'DEPOSIT') {
    return Math.max(0, Number(r.montantAcompte ?? 0) - Number(r.montantCommission ?? 0));
  }
  return Number(r.netProprietaire ?? 0);
}
