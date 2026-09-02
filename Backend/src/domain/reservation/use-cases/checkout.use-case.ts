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

import { NotificationsService } from '../../../modules/notifications/notifications.service';

@Injectable()
export class CheckoutUseCase {
  private readonly logger = new Logger(CheckoutUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { logement: { select: { gestionnaireId: true } } },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const isOwnerOrManager = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;
    if (!isOwnerOrManager) {
      throw new ForbiddenException('Seul le propriétaire ou le gestionnaire peut valider le check-out');
    }

    // Vérification de la fenêtre de check-out (4 h avant la date/heure de fin)
    const CHECKOUT_GUARD_MS = 4 * 60 * 60 * 1000;
    const checkoutWindowStart = new Date(reservation.dateFin).getTime() - CHECKOUT_GUARD_MS;
    if (Date.now() < checkoutWindowStart) {
      throw new ConflictException('Le check-out ne peut pas être effectué avant la date de fin du séjour.');
    }

    // Validation via State Machine
    this.stateMachine.transition(reservation.statut, StatutReservation.COMPLETED);

    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Passage au statut COMPLETED
      const updatedRes = await tx.reservation.update({
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
          raison: 'Check-out manuel validé par le propriétaire ou le gestionnaire',
        },
      });

      this.logger.log(`Réservation [${reservationId}] clôturée manuellement.`);

      return updatedRes;
    });

    // Envoi Push aux deux parties pour inviter à laisser un avis
    this.notifications.sendReservationPush(
      reservation.locataireId,
      'Séjour terminé ! 🏁',
      'Merci d\'avoir séjourné avec Klef ! Laissez un avis sur votre expérience.',
      '/reservations'
    ).catch((err) => this.logger.error(`Erreur Push checkout locataire: ${err.message}`));

    this.notifications.sendReservationPush(
      reservation.proprietaireId,
      'Séjour clôturé ! 🏁',
      'Le séjour à votre logement est maintenant clôturé.',
      '/reservations'
    ).catch((err) => this.logger.error(`Erreur Push checkout proprio: ${err.message}`));

    return updated;
  }
}
