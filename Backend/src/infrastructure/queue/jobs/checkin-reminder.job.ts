import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue.service';

/**
 * Processor pour les rappels de check-in (0h / +2h / +4h après dateDebut).
 * Chaque rappel vérifie que la réservation est toujours en CONFIRMED
 * (si le locataire/proprio ont déjà fait le check-in, on skip silencieusement).
 */
@Processor('reservation-jobs')
export class CheckinReminderJob {
  private readonly logger = new Logger(CheckinReminderJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  @Process('rappel-checkin-0h')
  async handleT0(job: Job<{ reservationId: string }>) {
    await this.sendReminder(job.data.reservationId, '0h');
  }

  @Process('rappel-checkin-2h')
  async handleT2(job: Job<{ reservationId: string }>) {
    await this.sendReminder(job.data.reservationId, '+2h');
  }

  @Process('rappel-checkin-4h')
  async handleT4(job: Job<{ reservationId: string }>) {
    await this.sendReminder(job.data.reservationId, '+4h');
  }

  private async sendReminder(reservationId: string, label: string): Promise<void> {
    this.logger.log(`[rappel-checkin ${label}] Traitement → ${reservationId}`);

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { logement: { select: { titre: true, adresse: true } } },
    });

    // Si la résa n'existe plus ou n'est plus CONFIRMED, le check-in a déjà eu lieu
    if (!reservation || reservation.statut !== StatutReservation.CONFIRMED) {
      this.logger.debug(
        `[rappel-checkin ${label}] Résa ${reservationId} non CONFIRMED (statut: ${reservation?.statut ?? 'introuvable'}) — skip`,
      );
      return;
    }

    const payload = {
      logementTitre: reservation.logement.titre,
      adresse: reservation.logement.adresse,
      dateDebut: reservation.dateDebut.toLocaleDateString('fr-FR'),
      reservationId,
      rappelLabel: label,
    };

    // Notifier les deux parties
    await Promise.all([
      this.queue.enqueueNotification(reservation.locataireId, 'RAPPEL_CHECKIN', payload),
      this.queue.enqueueNotification(reservation.proprietaireId, 'RAPPEL_CHECKIN', payload),
    ]);

    this.logger.log(`[rappel-checkin ${label}] Rappels envoyés pour ${reservationId}`);
  }
}
