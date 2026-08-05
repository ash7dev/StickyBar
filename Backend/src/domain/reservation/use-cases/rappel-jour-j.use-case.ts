import { Injectable, Logger } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';

import { NotificationsService } from '../../../modules/notifications/notifications.service';

@Injectable()
export class RappelJourJUseCase {
  private readonly logger = new Logger(RappelJourJUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(reservationId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { logement: { select: { titre: true, adresse: true } } },
    });

    if (!reservation || reservation.statut !== StatutReservation.CONFIRMED) {
      this.logger.warn(`[RappelJourJ] Résa ${reservationId} introuvable ou non CONFIRMED`);
      return;
    }

    const payload = {
      logementTitre: reservation.logement.titre,
      adresse: reservation.logement.adresse,
      dateDebut: reservation.dateDebut.toLocaleDateString('fr-FR'),
      reservationId,
    };

    await Promise.all([
      this.queue.enqueueNotification(reservation.locataireId, 'RAPPEL_JOUR_J', payload),
      this.queue.enqueueNotification(reservation.proprietaireId, 'RAPPEL_JOUR_J', payload),
      this.notifications.sendReservationPush(
        reservation.locataireId,
        'C\'est le grand jour ! ✈️',
        `Votre séjour à "${reservation.logement.titre}" commence aujourd'hui !`,
        '/reservations'
      ).catch(() => {}),
      this.notifications.sendReservationPush(
        reservation.proprietaireId,
        'Arrivée de voyageur aujourd\'hui ! 🔑',
        `Un séjour à "${reservation.logement.titre}" commence aujourd'hui.`,
        '/reservations'
      ).catch(() => {}),
    ]);

    this.logger.log(`[RappelJourJ] Rappels J-1 envoyés pour ${reservationId}`);
  }
}
