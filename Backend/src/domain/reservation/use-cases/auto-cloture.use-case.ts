import { Injectable, Logger } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ReservationStateMachine } from '../reservation.state-machine';
import { QueueService } from '../../../infrastructure/queue/queue.service';

@Injectable()
export class AutoClotureUseCase {
  private readonly logger = new Logger(AutoClotureUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly queue: QueueService,
  ) {}

  async execute(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });

    if (!reservation) {
      this.logger.warn(`Auto-clôture ignorée : réservation [${reservationId}] introuvable`);
      return;
    }

    try {
      this.stateMachine.transition(reservation.statut, StatutReservation.COMPLETED);
    } catch {
      this.logger.log(`Auto-clôture ignorée : transition impossible depuis [${reservation.statut}]`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { statut: StatutReservation.COMPLETED, closeLe: new Date(), updatedBySystem: true },
      });

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut,
          nouveauStatut: StatutReservation.COMPLETED,
          modifiePar: 'SYSTEM_AUTOCLOTURE',
          raison: 'Auto-clôture automatique (24h après la fin du séjour)',
        },
      });
    });

    // Ouvrir la fenêtre d'avis 7 jours après la clôture
    await this.queue.scheduleFenetreAvis(reservationId, new Date());

    this.logger.log(`Réservation [${reservationId}] clôturée automatiquement par le système`);
  }
}
