import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  StatutReservation,
  StatutLogement,
  ResultatAnnulation,
  TypeTransactionWallet,
  TypeFaute,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { ReservationStateMachine } from '../reservation.state-machine';
import { RefundPaymentUseCase } from '../../payment/use-cases/refund-payment.use-case';
import { NotificationsService } from '../../../modules/notifications/notifications.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { SystemLedgerService } from '../../system-ledger/system-ledger.service';
import { creditWallet, debitWallet } from '../../wallet/wallet-moves';
import { ownerCancelPenalty, paidOf, tenantCancelPlan } from '../../payment/refund-plan';

@Injectable()
export class CancelReservationUseCase {
  private readonly logger = new Logger(CancelReservationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly refundPayment: RefundPaymentUseCase,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
    private readonly systemLedger: SystemLedgerService,
  ) {}

  async execute(reservationId: string, userId: string, raison: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true, logement: { select: { gestionnaireId: true } } },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const isLocataire = reservation.locataireId === userId;
    const isProprio = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;

    if (!isLocataire && !isProprio) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à annuler cette réservation');
    }

    // Validation via State Machine
    this.stateMachine.transition(reservation.statut, StatutReservation.CANCELLED);

    const now = new Date();
    const hoursBeforeCheckin = (reservation.dateDebut.getTime() - now.getTime()) / 3_600_000;
    const confirmed =
      reservation.statut === StatutReservation.CONFIRMED || reservation.statut === StatutReservation.CHECKED_IN;
    // Tout se calcule sur ce que le locataire a réellement payé (acompte ou totalité, argent et coins)
    const paid = paidOf(reservation);

    let politique: ResultatAnnulation;
    let montantRembourse: number;
    let partHote = 0;
    let partPaixi = 0;
    let penaliteProprio = 0;

    if (isProprio) {
      // L'hôte (ou son gestionnaire) annule : le locataire récupère tout
      politique = confirmed ? ResultatAnnulation.UC4_PROPRIO_MOINS_3J : ResultatAnnulation.UC3_PROPRIO_REFUSE;
      montantRembourse = paid.total;
      // Refuser une demande en attente est un droit de l'hôte : pénalité seulement après confirmation
      penaliteProprio = ownerCancelPenalty(confirmed, hoursBeforeCheckin);
    } else {
      const plan = tenantCancelPlan(paid, { confirmed, hoursBeforeCheckin });
      politique = ResultatAnnulation[plan.policy];
      montantRembourse = plan.refund;
      partHote = plan.host;
      partPaixi = plan.paixi;
    }

    // La pénalité et les fautes visent toujours le propriétaire, même si c'est son gestionnaire qui annule
    const ownerId = reservation.proprietaireId;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: StatutReservation.CANCELLED,
          annuleLe: now,
          annuleParId: userId,
          raisonAnnulation: raison,
          politiqueAppliquee: politique,
        },
      });

      const refund = await this.refundPayment.refundInTx(tx, reservationId, {
        montant: montantRembourse,
        motif: politique,
        declenchePar: userId,
        montantPenaliteProprio: penaliteProprio,
        montantCommissionPaixi: partPaixi,
      });

      // Part retenue sur une annulation tardive du locataire : Paixi garde ses frais, l'hôte reçoit le reste
      if (refund.refundId !== null || montantRembourse === 0) {
        if (partHote > 0) {
          await creditWallet(tx, {
            utilisateurId: ownerId,
            reservationId,
            montant: partHote,
            type: TypeTransactionWallet.CREDIT_LOCATION,
            description: `Compensation annulation tardive du voyageur — résa ${reservationId.slice(0, 8).toUpperCase()}`,
          });
        }
        if (partHote > 0 || partPaixi > 0) {
          await this.systemLedger.recordCheckinRelease(tx, reservationId, partHote, partPaixi);
        }
      }

      if (isProprio && penaliteProprio > 0) {
        await debitWallet(tx, {
          utilisateurId: ownerId,
          reservationId,
          montant: penaliteProprio,
          type: TypeTransactionWallet.DEBIT_PENALITE,
          description: `Pénalité d'annulation — résa ${reservationId.slice(0, 8).toUpperCase()}`,
        });
        await this.systemLedger.recordOwnerPenalty(tx, reservationId, penaliteProprio);

        const updatedProprio = await tx.utilisateur.update({
          where: { id: ownerId },
          data: { nbAnnulations: { increment: 1 } },
        });

        await tx.compteurFaute.create({
          data: {
            utilisateurId: ownerId,
            type: TypeFaute.ANNULATION_APRES_CONFIRMATION,
            reservationId,
            penalite: penaliteProprio,
            description:
              userId === ownerId
                ? `Annulation par le propriétaire — réservation ${reservationId}`
                : `Annulation par le gestionnaire ${userId} — réservation ${reservationId}`,
          },
        });

        // Suspension automatique après 7 annulations
        if (updatedProprio.nbAnnulations >= 7) {
          await tx.logement.updateMany({
            where: { proprietaireId: ownerId, statut: StatutLogement.PUBLISHED },
            data: {
              statut: StatutLogement.SUSPENDED,
              rejectionReason: 'Suspension automatique : 7 annulations de réservations confirmées atteintes.',
            },
          });
          await this.redis.getClient().incr('listings:search:version');
          await this.redis.del('listings:feed:all');
          this.logger.error(`PROPRIÉTAIRE SUSPENDU [${ownerId}] pour annulations répétées.`);
        }
      }

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut,
          nouveauStatut: StatutReservation.CANCELLED,
          modifiePar: userId,
          raison: `Annulation par ${isProprio ? 'le propriétaire' : 'le locataire'}: ${raison}`,
          metadonnees: {
            politique,
            paye: paid.total,
            montantRembourse: refund.cash + refund.coins,
            rembourseArgent: refund.cash,
            rembourseCoins: refund.coins,
            partHote,
            partPaixi,
            penaliteProprio,
          },
        },
      });

      await this.queue.cancelReservationJobs(reservationId);

      return {
        id: updated.id,
        statut: updated.statut,
        montantRembourse: refund.cash + refund.coins,
        penaliteAppliquee: penaliteProprio,
      };
    }, { isolationLevel: 'Serializable' });

    // Notification Push à l'autre partie
    const targetUserId = isLocataire ? reservation.proprietaireId : reservation.locataireId;
    const title = isLocataire ? 'Réservation annulée ❌' : 'Réservation annulée par le propriétaire ⚠️';
    const message = isLocataire
      ? `Le locataire a annulé sa réservation (Motif : ${raison}).`
      : `Le propriétaire a annulé votre réservation (Motif : ${raison}).`;

    this.notifications.sendReservationPush(targetUserId, title, message, '/reservations')
      .catch((err) => this.logger.error(`Erreur Push annulation: ${err.message}`));

    return result;
  }
}

