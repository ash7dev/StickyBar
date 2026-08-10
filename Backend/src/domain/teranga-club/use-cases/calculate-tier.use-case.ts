import { TerangaTier } from '@prisma/client';

export interface CalculateTierResult {
  tier: TerangaTier;
  cashbackPct: number;
  nextTier: TerangaTier | null;
  gmvRemainingForNextTier: number;
}

export class CalculateTierUseCase {
  static execute(gmv12Mois: number, nbSejours: number): CalculateTierResult {
    if (gmv12Mois >= 1000000 || nbSejours >= 8) {
      return {
        tier: TerangaTier.GOLD,
        cashbackPct: 3.0,
        nextTier: null,
        gmvRemainingForNextTier: 0,
      };
    }

    if (gmv12Mois >= 250000 || nbSejours >= 3) {
      return {
        tier: TerangaTier.SILVER,
        cashbackPct: 2.0,
        nextTier: TerangaTier.GOLD,
        gmvRemainingForNextTier: Math.max(0, 1000000 - gmv12Mois),
      };
    }

    return {
      tier: TerangaTier.BRONZE,
      cashbackPct: 1.5,
      nextTier: TerangaTier.SILVER,
      gmvRemainingForNextTier: Math.max(0, 250000 - gmv12Mois),
    };
  }
}
