/**
 * Supplément par nuit pour un nombre de voyageurs, selon la grille du logement.
 * Aucun supplément tant qu'on ne dépasse pas personnesBase. Partagé avec le calcul
 * des suppléments « voyageurs en plus » demandés pendant le séjour.
 */
export function supplementPersonnesParNuit(
  nbPersonnes: number,
  personnesBase: number,
  tarifsPersonnes: Array<{ personnesMin: number; personnesMax: number; supplement: unknown }>,
): number {
  if (nbPersonnes <= personnesBase) return 0;
  const tarif = tarifsPersonnes.find((t) => nbPersonnes >= t.personnesMin && nbPersonnes <= t.personnesMax);
  return tarif ? Number(tarif.supplement) : 0;
}
