import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { NotificationsService } from '../../../modules/notifications/notifications.service';

@Injectable()
export class CheckoutProprioUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        photosEtatLieu: { where: { type: 'CHECKOUT' } },
        logement: { select: { gestionnaireId: true } },
      },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    const isOwnerOrManager = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;
    if (!isOwnerOrManager) {
      throw new ForbiddenException('Seul le propriétaire ou le gestionnaire peut confirmer le check-out');
    }
    if (reservation.statut !== StatutReservation.CHECKED_IN) {
      throw new ConflictException(`Action impossible dans le statut actuel: ${reservation.statut}`);
    }

    // Vérification de la fenêtre de check-out (4 h avant la date/heure de fin)
    const CHECKOUT_GUARD_MS = 4 * 60 * 60 * 1000;
    const checkoutWindowStart = new Date(reservation.dateFin).getTime() - CHECKOUT_GUARD_MS;
    if (Date.now() < checkoutWindowStart) {
      throw new ConflictException("L'état des lieux de sortie ne peut pas être effectué avant la date de fin du séjour.");
    }

    if (reservation.photosEtatLieu.length === 0) {
      throw new ConflictException("Aucune photo de check-out — uploadez au moins une photo avant de confirmer");
    }

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { checkoutProprioLe: new Date() },
    });

    // Notification au locataire
    this.notifications.sendReservationPush(
      reservation.locataireId,
      'État des lieux de sortie confirmé ✅',
      'Le propriétaire a validé l\'état des lieux de sortie. Le séjour est maintenant terminé.',
      `/reservations/${reservationId}`
    ).catch(() => {});
  }
}
