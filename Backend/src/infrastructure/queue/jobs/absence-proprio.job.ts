import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProprioAbsentExpireUseCase } from '../../../domain/reservation/use-cases/proprio-absent-expire.use-case';
import { QueueService } from '../queue.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('absence-jobs')
export class AbsenceProprioJob {
  private readonly logger = new Logger(AbsenceProprioJob.name);

  constructor(
    private readonly expireUseCase: ProprioAbsentExpireUseCase,
    private readonly queue: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('rappel-absence')
  async handle(job: Job<{ reservationId: string; attempt: number }>) {
    const { reservationId, attempt } = job.data;
    this.logger.log(`[rappel-absence] Traitement résa ${reservationId} (Tentative ${attempt}/4)`);

    // 1. Vérifier si la situation est résolue (Check-in validé ou photos uploadées)
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.checkinProprioLe || reservation.statut !== 'CONFIRMED') {
      this.logger.log(`[rappel-absence] Situation résolue ou invalide pour ${reservationId}.`);
      return;
    }

    if (attempt < 4) {
      // Notifier le proprio via la queue notification
      await this.queue.enqueueNotification(reservation.proprietaireId, 'ABSENCE_PROPRIO_ALERTE', {
        logementId: reservation.logementId,
        reservationId,
        attempt,
      });
      this.logger.log(`[rappel-absence] Notification rappel #${attempt} au propriétaire.`);

      // Re-scheduler le prochain rappel dans 30 min
      await this.queue.scheduleAbsenceConfirmation(reservationId, attempt + 1);
    } else {
      // 4. Délai de 2h dépassé (4 rappels x 30min) -> Annulation & Pénalité
      this.logger.warn(`[rappel-absence] Délai 2h dépassé pour ${reservationId}. Lancement de l'expiration forcée.`);
      await this.expireUseCase.execute(reservationId);
    }
  }
}
