import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { NotificationsService } from '../../../modules/notifications/notifications.service';
import { traceAction } from '../trace';
import { QueueService } from '../../../infrastructure/queue/queue.service';

@Injectable()
export class CheckinProprioUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly queue: QueueService,
  ) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        photosEtatLieu: { where: { type: 'CHECKIN' } },
        logement: { select: { gestionnaireId: true } },
      },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    const isOwnerOrManager = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;
    if (!isOwnerOrManager) {
      throw new ForbiddenException('Seul le propriétaire ou le gestionnaire peut confirmer le check-in');
    }
    if (reservation.statut !== StatutReservation.CONFIRMED) {
      throw new ConflictException(`Action impossible dans le statut actuel: ${reservation.statut}`);
    }
    if (reservation.photosEtatLieu.length === 0) {
      throw new ConflictException("Aucune photo d'état des lieux — uploadez au moins une photo avant de confirmer");
    }

    // Garde temporelle : l'état des lieux d'entrée n'est autorisé qu'à partir
    // de 4h avant dateDebut pour empêcher un propriétaire de confirmer le
    // check-in prématurément afin de déclencher le versement des fonds.
    const checkinWindowStart = new Date(reservation.dateDebut);
    checkinWindowStart.setHours(checkinWindowStart.getHours() - 4);
    if (new Date() < checkinWindowStart) {
      throw new ConflictException(
        "L'état des lieux d'entrée ne peut être confirmé que 4h avant l'arrivée du locataire",
      );
    }

    const now = new Date();
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { checkinProprioLe: now },
    });
    await traceAction(this.prisma, { reservationId, statut: reservation.statut, actorId: userId, action: 'ETAT_LIEUX_ENTREE' });

    // État des lieux après l'heure d'arrivée : le voyageur garde 6h pour valider
    if (now > reservation.dateDebut) await this.queue.scheduleLateAutoCheckin(reservationId, now);

    // Notification au locataire
    this.notifications.sendReservationPush(
      reservation.locataireId,
      'État des lieux d\'entrée confirmé ✅',
      'Le propriétaire a validé l\'état des lieux d\'entrée. Vous pouvez maintenant accéder au logement.',
      `/reservations/${reservationId}`
    ).catch(() => {});
  }
}
