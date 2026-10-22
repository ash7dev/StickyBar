import { Prisma, StatutReservation } from '@prisma/client';

/**
 * Traçabilité : chaque action faite sur un séjour (par l'hôte, le gestionnaire ou le
 * voyageur) laisse une ligne dans l'historique, avec son auteur. Le statut ne change pas :
 * l'action se lit dans `metadonnees.action`.
 */
export type TraceAction =
  | 'ETAT_LIEUX_ENTREE'
  | 'ETAT_LIEUX_SORTIE'
  | 'SUPPLEMENT_DECLARE'
  | 'SUPPLEMENT_ENCAISSE'
  | 'SUPPLEMENT_CONTESTE';

type HistoriqueWriter = { reservationHistorique: { create: (args: { data: Prisma.ReservationHistoriqueUncheckedCreateInput }) => Promise<unknown> } };

export function traceAction(
  db: HistoriqueWriter,
  p: { reservationId: string; statut: StatutReservation | string; actorId: string; action: TraceAction; raison?: string; meta?: Record<string, unknown> },
) {
  return db.reservationHistorique.create({
    data: {
      reservationId: p.reservationId,
      ancienStatut: p.statut as StatutReservation,
      nouveauStatut: p.statut as StatutReservation,
      modifiePar: p.actorId,
      raison: p.raison,
      metadonnees: { action: p.action, ...(p.meta ?? {}) } as Prisma.InputJsonValue,
    },
  });
}
