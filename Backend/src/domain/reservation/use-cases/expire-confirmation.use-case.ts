import { Injectable, Logger } from '@nestjs/common';
import { StatutReservation, ResultatAnnulation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ReservationStateMachine } from '../reservation.state-machine';
import { RefundPaymentUseCase } from '../../payment/use-cases/refund-payment.use-case';
import { NotificationsService } from '../../../modules/notifications/notifications.service';

@Injectable()
export class ExpireConfirmationUseCase {
  private readonly logger = new Logger(ExpireConfirmationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly refundPayment: RefundPaymentUseCase,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true },
    });

    if (!reservation) return;

    // Uniquement si le proprio n'a pas confirmé à temps
    if (reservation.statut !== StatutReservation.PAID) {
      this.logger.debug(`expire-confirmation ignoré : statut [${reservation.statut}] pour [${reservationId}]`);
      return;
    }

    try {
      this.stateMachine.transition(reservation.statut, StatutReservation.EXPIRED);
    } catch {
      this.logger.debug(`expire-confirmation : transition impossible pour [${reservationId}]`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: StatutReservation.EXPIRED,
          annuleLe: new Date(),
          annuleParId: 'SYSTEM_CONFIRMATION_EXPIRY',
          raisonAnnulation: 'Expiration automatique : délai de confirmation propriétaire dépassé',
          politiqueAppliquee: ResultatAnnulation.UC1_LOCATAIRE_NON_CONFIRMEE,
          updatedBySystem: true,
        },
      });

      // L'hôte n'a jamais accepté : le locataire récupère tout ce qu'il a payé (argent et coins)
      await this.refundPayment.refundInTx(tx, reservationId, {
        montant: Number.MAX_SAFE_INTEGER,
        motif: ResultatAnnulation.UC1_LOCATAIRE_NON_CONFIRMEE,
        declenchePar: 'SYSTEM_CONFIRMATION_EXPIRY',
      });

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: StatutReservation.PAID,
          nouveauStatut: StatutReservation.EXPIRED,
          modifiePar: 'SYSTEM_CONFIRMATION_EXPIRY',
          raison: 'Délai de confirmation dépassé — remboursement 100% au locataire',
        },
      });
    }, { isolationLevel: 'Serializable' });

    this.logger.log(`Réservation [${reservationId}] expirée : proprio n'a pas confirmé dans le délai imparti`);

    // Push au locataire
    this.notifications.sendReservationPush(
      reservation.locataireId,
      'Réservation expirée — Remboursement 100% 💰',
      'Le propriétaire n\'a pas confirmé votre réservation à temps. Vous serez remboursé intégralement.',
      '/reservations'
    ).catch(() => {});
  }
}
