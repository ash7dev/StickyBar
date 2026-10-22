import { Injectable, Logger } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { NotificationsService } from '../../../modules/notifications/notifications.service';

@Injectable()
export class FermerFenetreAvisUseCase {
  private readonly logger = new Logger(FermerFenetreAvisUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(reservationId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        logement: { select: { titre: true } },
        avis: { select: { auteurId: true } },
      },
    });

    if (!reservation || reservation.statut !== StatutReservation.COMPLETED) {
      this.logger.warn(`[FermerFenetreAvis] Résa ${reservationId} introuvable ou non COMPLETED`);
      return;
    }

    const authorIds = new Set(reservation.avis.map((a) => a.auteurId));
    const logementTitre = reservation.logement.titre;

    // Rappel J+3 : il reste 4 jours pour noter (fenêtre de 7 jours, refusée ensuite par l'API)
    const reminders: Promise<unknown>[] = [];
    if (!authorIds.has(reservation.locataireId)) {
      reminders.push(
        this.notifications.sendReservationPush(reservation.locataireId, `Comment était ${logementTitre} ?`, 'Votre avis aide votre hôte et les prochains voyageurs. Encore 4 jours pour noter.', `/reservation/${reservationId}`),
      );
    }
    if (!authorIds.has(reservation.proprietaireId)) {
      reminders.push(
        this.notifications.sendReservationPush(reservation.proprietaireId, 'Notez votre voyageur', `Comment s’est passé le séjour à ${logementTitre} ? Encore 4 jours pour noter.`, `/(owner)/reservations/${reservationId}`),
      );
    }
    await Promise.all(reminders.map((r) => r.catch(() => {})));
    const toNotify = reminders;

    this.logger.log(
      `[FermerFenetreAvis] Fenêtre fermée pour ${reservationId} — ${toNotify.length} rappel(s) d'avis envoyé(s)`,
    );
  }
}
