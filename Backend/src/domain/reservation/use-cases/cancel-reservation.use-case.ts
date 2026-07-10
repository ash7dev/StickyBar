import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  StatutReservation,
  StatutPaiement,
  StatutLogement,
  PolitiqueAnnulation,
  SensTransaction,
  TypeTransactionWallet,
  TypeFaute,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { ReservationStateMachine } from '../reservation.state-machine';
import { RefundPaymentUseCase } from '../../payment/use-cases/refund-payment.use-case';

@Injectable()
export class CancelReservationUseCase {
  private readonly logger = new Logger(CancelReservationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly stateMachine: ReservationStateMachine,
    private readonly refundPayment: RefundPaymentUseCase,
  ) {}

  async execute(reservationId: string, userId: string, raison: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const isLocataire = reservation.locataireId === userId;
    const isProprio = reservation.proprietaireId === userId;

    if (!isLocataire && !isProprio) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à annuler cette réservation');
    }

    // Validation via State Machine
    this.stateMachine.transition(reservation.statut, StatutReservation.CANCELLED);

    const now = new Date();
    const diffMs = reservation.dateDebut.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffHours = diffMs / (1000 * 60 * 60);

    let politique: PolitiqueAnnulation = PolitiqueAnnulation.REMBOURSEMENT_100;
    let montantRembourse = 0;
    let penaliteProprio = 0;

    if (isProprio) {
      politique = PolitiqueAnnulation.FAUTE_PROPRIO;
      montantRembourse = Number(reservation.totalLocataire);
      if (diffDays > 7) penaliteProprio = 5000;
      else if (diffDays >= 2) penaliteProprio = 10000;
      else penaliteProprio = 20000;
    } else {
      if (diffDays > 7) {
        politique = PolitiqueAnnulation.REMBOURSEMENT_100;
        montantRembourse = Number(reservation.totalLocataire);
      } else if (diffDays >= 3) {
        politique = PolitiqueAnnulation.REMBOURSEMENT_50;
        montantRembourse = Number(reservation.totalLocataire) * 0.5;
      } else if (diffHours >= 24) {
        politique = PolitiqueAnnulation.REMBOURSEMENT_25;
        montantRembourse = Number(reservation.totalLocataire) * 0.25;
      } else {
        politique = PolitiqueAnnulation.REMBOURSEMENT_0;
        montantRembourse = 0;
      }
    }

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

      if (reservation.paiement && reservation.paiement.statut === StatutPaiement.CONFIRME) {
        await tx.paiement.update({
          where: { reservationId },
          data: {
            statut: StatutPaiement.REMBOURSE,
            rembourseLe: now,
            montantRembourse: montantRembourse,
          },
        });
      }

      if (isProprio && penaliteProprio > 0) {
        const wallet = await tx.wallet.findUnique({ where: { utilisateurId: userId } });
        if (wallet) {
          const solde = Number(wallet.soldeDisponible);
          if (solde >= penaliteProprio) {
            const newSolde = solde - penaliteProprio;
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { soldeDisponible: newSolde },
            });
            await tx.transactionWallet.create({
              data: {
                walletId: wallet.id,
                reservationId,
                type: TypeTransactionWallet.DEBIT_PENALITE,
                montant: penaliteProprio,
                sens: SensTransaction.DEBIT,
                soldeApres: newSolde,
                description: `Pénalité annulation réservation ${reservationId}`,
              },
            });
          } else {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { dettePenalites: { increment: penaliteProprio } },
            });
          }
        }

        // Incrémenter le compteur d'annulations et tracer la faute
        const updatedProprio = await tx.utilisateur.update({
          where: { id: userId },
          data: { nbAnnulations: { increment: 1 } },
        });

        await tx.compteurFaute.create({
          data: {
            utilisateurId: userId,
            type: TypeFaute.ANNULATION_APRES_CONFIRMATION,
            reservationId,
            penalite: penaliteProprio,
            description: `Annulation par le propriétaire — réservation ${reservationId}`,
          },
        });

        // Suspension automatique après 3 annulations
        if (updatedProprio.nbAnnulations >= 3) {
          await tx.logement.updateMany({
            where: { proprietaireId: userId, statut: StatutLogement.PUBLISHED },
            data: {
              statut: StatutLogement.SUSPENDED,
              rejectionReason: 'Suspension automatique : trop d\'annulations de réservations confirmées.',
            },
          });
          this.logger.error(`PROPRIÉTAIRE SUSPENDU [${userId}] pour annulations répétées.`);
        }
      }

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut,
          nouveauStatut: StatutReservation.CANCELLED,
          modifiePar: userId,
          raison: `Annulation par ${isProprio ? 'le propriétaire' : 'le locataire'}: ${raison}`,
          metadonnees: { politique, montantRembourse, penaliteProprio },
        },
      });

      await this.queue.cancelReservationJobs(reservationId);

      return {
        id: updated.id,
        statut: updated.statut,
        montantRembourse,
        penaliteAppliquee: penaliteProprio,
      };
    }, { isolationLevel: 'RepeatableRead' });

    // Déclencher le remboursement financier réel après la TX (appel API externe)
    if (montantRembourse > 0) {
      await this.refundPayment.execute(reservationId);
    }

    return result;
  }
}
