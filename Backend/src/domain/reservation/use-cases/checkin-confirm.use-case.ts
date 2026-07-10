import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StatutPaiement, StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { ReservationStateMachine } from '../reservation.state-machine';

@Injectable()
export class CheckInConfirmUseCase {
  private readonly logger = new Logger(CheckInConfirmUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly stateMachine: ReservationStateMachine,
  ) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.locataireId !== userId) {
      throw new ForbiddenException('Seul le locataire peut confirmer le check-in');
    }

    this.stateMachine.transition(reservation.statut, StatutReservation.CHECKED_IN);

    if (!reservation.checkinProprioLe) {
      throw new ConflictException(
        "Le propriétaire doit d'abord uploader les photos de l'état des lieux",
      );
    }

    // 1. Transition statut + confirmation paiement (RepeatableRead)
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.reservation.update({
        where: { id: reservationId },
        data: { statut: StatutReservation.CHECKED_IN, checkinLocataireLe: now },
      });

      if (reservation.paiement) {
        await tx.paiement.update({
          where: { reservationId },
          data: { statut: StatutPaiement.CONFIRME },
        });
      }

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: StatutReservation.CONFIRMED,
          nouveauStatut: StatutReservation.CHECKED_IN,
          modifiePar: userId,
          raison: 'Check-in validé par le locataire (point de non-retour)',
        },
      });
    }, { isolationLevel: 'Serializable' });

    // 2. Crédit wallet via job (retry automatique si panne entre ici et le worker)
    await this.queue.scheduleCreditWallet(reservationId);

    // 3. Clôture automatique 24h après dateFin
    await this.queue.scheduleAutoClose(reservationId, reservation.dateFin);

    this.logger.log(`Check-in validé [${reservationId}]. Fonds débloqués. Auto-clôture programmée.`);
  }
}
