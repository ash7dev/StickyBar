import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ReservationStateMachine } from '../reservation.state-machine';

@Injectable()
export class CheckoutUseCase {
  private readonly logger = new Logger(CheckoutUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
  ) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');

    if (reservation.proprietaireId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut valider le check-out');
    }

    // Validation via State Machine
    this.stateMachine.transition(reservation.statut, StatutReservation.COMPLETED);

    return await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Passage au statut COMPLETED
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: StatutReservation.COMPLETED,
          checkoutProprioLe: reservation.checkoutProprioLe || now,
          closeLe: now,
        },
      });

      // 2. Historique
      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: StatutReservation.CHECKED_IN,
          nouveauStatut: StatutReservation.COMPLETED,
          modifiePar: userId,
          raison: 'Check-out manuel validé par le propriétaire',
        },
      });

      this.logger.log(`Réservation [${reservationId}] clôturée manuellement par le propriétaire.`);

      // TODO: Notification invitation avis aux deux parties
      
      return updated;
    });
  }
}
