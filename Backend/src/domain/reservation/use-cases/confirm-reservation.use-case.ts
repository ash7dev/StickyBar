import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StatutReservation, StatutKyc } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { ReservationStateMachine } from '../reservation.state-machine';

import { NotificationsService } from '../../../modules/notifications/notifications.service';

/** Applique une heure HH:mm sur une Date (sans muter l'original). */
function applyTime(base: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

@Injectable()
export class ConfirmReservationUseCase {
  private readonly logger = new Logger(ConfirmReservationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(reservationId: string, userId: string, heureDebut?: string, heureFin?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: {
          locataire: { select: { statutKyc: true } },
          proprietaire: { select: { statutKyc: true } },
        },
      });

      if (!reservation) throw new NotFoundException('Réservation introuvable');
      if (reservation.proprietaireId !== userId) {
        throw new ForbiddenException('Vous n\'êtes pas autorisé à confirmer cette réservation');
      }

      // Vérification KYC du locataire
      if (reservation.locataire.statutKyc !== StatutKyc.VERIFIE) {
        throw new ForbiddenException(
          "Le KYC du locataire n'est pas encore vérifié. Vous ne pouvez pas confirmer cette réservation.",
        );
      }

      // Vérification KYC du propriétaire (NOUVEAU)
      if (reservation.proprietaire.statutKyc === StatutKyc.REJETE || reservation.proprietaire.statutKyc === StatutKyc.SUSPENDU) {
        throw new ForbiddenException(
          "Votre compte propriétaire ne vous permet pas de confirmer de réservations (KYC rejeté ou suspendu).",
        );
      }

      if (reservation.proprietaire.statutKyc !== StatutKyc.VERIFIE) {
        throw new ForbiddenException(
          "Votre KYC doit être vérifié avant de pouvoir confirmer des réservations.",
        );
      }

      if (reservation.delaiConfirmation && new Date() > reservation.delaiConfirmation) {
        throw new UnprocessableEntityException('Le délai de confirmation est dépassé. La réservation doit être annulée.');
      }

      this.stateMachine.transition(reservation.statut, StatutReservation.CONFIRMED);

      /*
       * Mise à jour des vrais horaires de séjour (dateDebut / dateFin).
       * Heure de check-in : heureDebut (ex: 14:00)
       * Heure de check-out : heureFin (ex: 12:00)
       */
      let newDateDebut = reservation.dateDebut;
      let newDateFin   = reservation.dateFin;

      if (heureDebut) {
        newDateDebut = applyTime(reservation.dateDebut, heureDebut);
      }

      const finalCheckoutTime = heureFin || '12:00';
      newDateFin = applyTime(reservation.dateFin, finalCheckoutTime);

      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut:      StatutReservation.CONFIRMED,
          confirmeeLe: new Date(),
          dateDebut:   newDateDebut,
          dateFin:     newDateFin,
        },
      });

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut:  reservation.statut,
          nouveauStatut: StatutReservation.CONFIRMED,
          modifiePar:    userId,
          raison: `Confirmation par le propriétaire — Check-in ${heureDebut || '14:00'}, Check-out ${finalCheckoutTime}`,
        },
      });

      return { updated, dateDebut: newDateDebut };
    }, { isolationLevel: 'RepeatableRead' });

    await Promise.all([
      this.queue.scheduleArrivalReminder(reservationId, result.dateDebut),
      this.queue.scheduleAutoCheckin(reservationId, result.dateDebut),
      this.queue.scheduleCheckinReminders(reservationId, result.dateDebut),
    ]);

    this.logger.log(`Réservation [${reservationId}] confirmée par le propriétaire [${userId}]${heureDebut ? ` (check-in ${heureDebut})` : ''}`);

    // Notification Push au locataire
    this.notifications.sendReservationPush(
      result.updated.locataireId,
      'Réservation confirmée ! 🎉',
      'Votre réservation a été validée par le propriétaire. Préparez votre séjour !',
      '/reservations'
    ).catch((err) => this.logger.error(`Erreur Push confirmation: ${err.message}`));

    return result.updated;
  }
}
