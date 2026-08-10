import { Injectable, Logger } from '@nestjs/common';
import { StatutReservation, StatutPaiement, StatutLogement, SensTransaction, TypeTransactionWallet, ResultatAnnulation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ReservationStateMachine } from '../reservation.state-machine';
import { RefundPaymentUseCase } from '../../payment/use-cases/refund-payment.use-case';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { NotificationsService } from '../../../modules/notifications/notifications.service';

@Injectable()
export class ProprioAbsentExpireUseCase {
  private readonly logger = new Logger(ProprioAbsentExpireUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly refundPayment: RefundPaymentUseCase,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true },
    });

    if (!reservation) return;

    // Validation via State Machine
    try {
      this.stateMachine.transition(reservation.statut, StatutReservation.CANCELLED);
    } catch (error) {
      return;
    }

    if (!reservation.absenceSignaleeLe) return;

    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const PENALITE_ABSENCE = 10000;

      // 1. Annulation automatique (ABSENCE_PROPRIO)
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: StatutReservation.CANCELLED,
          annuleLe: now,
          annuleParId: 'SYSTEM_ABSENCE',
          politiqueAppliquee: ResultatAnnulation.ABSENCE_PROPRIO,
          raisonAnnulation: 'Annulation automatique : propriétaire injoignable le jour du check-in (délai 2h dépassé)',
        },
      });

      // 2. Remboursement 100% au locataire
      if (reservation.paiement && reservation.paiement.statut === StatutPaiement.CONFIRME) {
        await tx.paiement.update({
          where: { reservationId },
          data: {
            statut: StatutPaiement.REMBOURSE,
            rembourseLe: now,
            montantRembourse: reservation.totalLocataire,
          },
        });
      }

      // 3. Pénalité et incrémentation compteur fautes
      const wallet = await tx.wallet.findUnique({ where: { utilisateurId: reservation.proprietaireId } });
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { dettePenalites: { increment: PENALITE_ABSENCE } },
        });
      }

      const updatedUser = await tx.utilisateur.update({
        where: { id: reservation.proprietaireId },
        data: { nbAbsencesJourJ: { increment: 1 } },
      });

      await tx.compteurFaute.create({
        data: {
          utilisateurId: reservation.proprietaireId,
          type: 'ABSENCE_JOUR_J',
          reservationId,
          penalite: PENALITE_ABSENCE,
          description: 'Absence constatée le jour du check-in',
        },
      });

      // 4. Sanction radicale : Suspension si >= 7 absences
      if (updatedUser.nbAbsencesJourJ >= 7) {
        await tx.logement.updateMany({
          where: { proprietaireId: reservation.proprietaireId, statut: StatutLogement.PUBLISHED },
          data: {
            statut: StatutLogement.SUSPENDED,
            rejectionReason: 'Suspension automatique : 7 absences signalées le jour du check-in atteintes.',
          },
        });
        await this.redis.getClient().incr('listings:search:version');
        await this.redis.del('listings:feed:all');
        this.logger.error(`PROPRIÉTAIRE SUSPENDU [${reservation.proprietaireId}] pour absences répétées.`);
      }

      // 5. Historique
      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut,
          nouveauStatut: StatutReservation.CANCELLED,
          modifiePar: 'SYSTEM_ABSENCE',
          raison: 'Absence propriétaire confirmée après 2h d\'attente.',
        },
      });

      this.logger.log(`Réservation [${reservationId}] annulée pour absence proprio. Pénalité appliquée.`);

      return updated;
    }, { isolationLevel: 'RepeatableRead' });

    // Déclencher le remboursement financier réel après la TX
    await this.refundPayment.execute(reservationId);

    // Notifier les deux parties
    this.notifications.sendReservationPush(
      reservation.locataireId,
      '🔄 Réservation annulée — Remboursement en cours',
      'Le propriétaire est resté injoignable pendant plus de 2h. Votre réservation a été annulée et un remboursement intégral est en cours.',
      `/reservations/${reservationId}`,
    ).catch(() => {});

    this.notifications.sendReservationPush(
      reservation.proprietaireId,
      '🚫 Absence confirmée — Pénalité appliquée',
      'Vous n\'avez pas répondu dans le délai de 2h après le signalement du locataire. La réservation a été annulée, le locataire remboursé, et une pénalité de 10 000 FCFA a été appliquée.',
      `/dashboard/reservations/${reservationId}`,
    ).catch(() => {});

    return result;
  }
}

