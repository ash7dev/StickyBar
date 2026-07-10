import { Injectable, Logger } from '@nestjs/common';
import { StatutReservation, StatutPaiement } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ReservationStateMachine } from '../reservation.state-machine';

@Injectable()
export class ExpirePendingUseCase {
  private readonly logger = new Logger(ExpirePendingUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
  ) {}

  async execute(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) return;

    // Validation via State Machine
    try {
      this.stateMachine.transition(reservation.statut, StatutReservation.EXPIRED);
    } catch (error) {
      this.logger.debug(`Expiration annulée : transition impossible depuis [${reservation.statut}]`);
      return;
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Passage en EXPIRED
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: StatutReservation.EXPIRED,
          updatedBySystem: true,
        },
      });

      // 2. Historique
      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: StatutReservation.PENDING,
          nouveauStatut: StatutReservation.EXPIRED,
          modifiePar: 'SYSTEM_EXPIRY',
          raison: 'Expiration automatique : paiement non reçu dans le délai imparti (30 min)',
        },
      });

      this.logger.log(`Réservation [${reservationId}] expirée par le système (Timeout Paiement).`);

      return updated;
    });
  }
}
