import { Prisma } from '@prisma/client';

/**
 * Logements gérés par l'utilisateur dans l'espace hôte : ceux dont il est
 * propriétaire ou gestionnaire délégué, hors logements archivés.
 */
export function ownedLogements(userId: string): Prisma.LogementWhereInput {
  return {
    archiveLe: null,
    OR: [{ proprietaireId: userId }, { gestionnaireId: userId }],
  };
}
