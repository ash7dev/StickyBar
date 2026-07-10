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
  ) {}

  async execute(reservationId: string, userId: string, heureDebut?: string) {
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
       * Si l'owner a fourni une heure (HH:mm), on met à jour dateDebut et dateFin
       * pour refléter les vrais horaires du séjour plutôt que minuit par défaut.
       * dateFin = même heure + 1h pour donner une marge de nettoyage à l'owner.
       */
      let newDateDebut = reservation.dateDebut;
      let newDateFin   = reservation.dateFin;

      if (heureDebut) {
        newDateDebut = applyTime(reservation.dateDebut, heureDebut);

        const [h, m] = heureDebut.split(':').map(Number);
        const checkoutH = (h + 1) % 24;
        const checkoutHhmm = `${String(checkoutH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        newDateFin = applyTime(reservation.dateFin, checkoutHhmm);
      }

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
          raison: heureDebut
            ? `Confirmation par le propriétaire — check-in ${heureDebut}`
            : 'Confirmation par le propriétaire',
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
    return result.updated;
  }
}
