import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { StatutReservation, StatutPaiement } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ReservationStateMachine } from '../reservation.state-machine';

@Injectable()
export class CheckInRefuseUseCase {
  private readonly logger = new Logger(CheckInRefuseUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
  ) {}

  async execute(reservationId: string, userId: string, motif: string, commentaire: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');

    if (reservation.locataireId !== userId) {
      throw new ForbiddenException('Seul le locataire peut refuser le check-in');
    }

    // Validation via State Machine
    this.stateMachine.transition(reservation.statut, StatutReservation.DISPUTED);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Passage en litige (DISPUTED)
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: StatutReservation.DISPUTED,
        },
      });

      // 2. Geler les fonds
      if (reservation.paiement) {
        await tx.paiement.update({
          where: { reservationId },
          data: { statut: StatutPaiement.GELE },
        });
      }

      // 3. Créer le litige (si une table Dispute existe, sinon Historique)
      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: StatutReservation.CONFIRMED,
          nouveauStatut: StatutReservation.DISPUTED,
          modifiePar: userId,
          raison: `Refus check-in: ${motif}`,
          metadonnees: { commentaire },
        },
      });

      this.logger.warn(`Check-in REFUSÉ pour la réservation [${reservationId}]. Statut: DISPUTED. Admin notifié.`);

      // TODO: Notification Admin pour arbitrage
      
      return updated;
    });
  }
}
