import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';

@Injectable()
export class ProprioAbsentUseCase {
  private readonly logger = new Logger(ProprioAbsentUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.locataireId !== userId) {
      throw new ForbiddenException('Seul le locataire peut signaler une absence');
    }
    if (reservation.statut !== StatutReservation.CONFIRMED) {
      throw new ConflictException('Signalement impossible dans ce statut');
    }
    if (reservation.absenceSignaleeLe) {
      throw new ConflictException('Une absence a déjà été signalée pour cette réservation');
    }

    // Mise à jour + historique dans la même transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: reservationId },
        data: { absenceSignaleeLe: new Date() },
      });

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: StatutReservation.CONFIRMED,
          nouveauStatut: StatutReservation.CONFIRMED,
          modifiePar: userId,
          raison: 'Locataire signale le propriétaire injoignable le jour du check-in',
        },
      });

      return res;
    });

    // Scheduler le job d'absence après la TX
    await this.queue.scheduleAbsenceConfirmation(reservationId);
    this.logger.log(`Absence propriétaire signalée pour [${reservationId}]. Worker 2h activé.`);

    return updated;
  }
}
