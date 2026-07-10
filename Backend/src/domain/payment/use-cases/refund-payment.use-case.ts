import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StatutPaiement, TypeTransactionWallet, SensTransaction } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RefundPaymentUseCase {
  private readonly logger = new Logger(RefundPaymentUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rembourse un paiement à 100% et crédite le wallet du locataire
   * @param reservationId ID de la réservation à rembourser
   * @param percentage Pourcentage du remboursement (100 par défaut pour litiges FONDE)
   */
  async execute(reservationId: string, percentage: number = 100): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { locataire: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Réservation ${reservationId} introuvable`);
    }

    const paiement = await this.prisma.paiement.findUnique({
      where: { reservationId }
    });

    if (!paiement) {
      this.logger.warn(`Aucun paiement trouvé pour la réservation ${reservationId}`);
      return;
    }

    // Si déjà remboursé, on ne fait rien
    if (paiement.statut === StatutPaiement.REMBOURSE) {
      this.logger.log(`Paiement déjà remboursé pour la réservation ${reservationId}`);
      return;
    }

    // Calcul du montant à rembourser
    const montantTotal = reservation.totalLocataire;
    const montantRembourse = new Decimal(montantTotal).mul(percentage).div(100);

    await this.prisma.$transaction(async (tx) => {
      // 1. Marquer le paiement comme remboursé
      await tx.paiement.update({
        where: { reservationId },
        data: {
          statut: StatutPaiement.REMBOURSE,
          rembourseLe: new Date(),
        },
      });

      // 2. Créditer le wallet du locataire (système de compensation interne)
      const wallet = await tx.wallet.upsert({
        where: { utilisateurId: reservation.locataireId },
        create: {
          utilisateurId: reservation.locataireId,
          soldeDisponible: montantRembourse,
          dettePenalites: 0,
        },
        update: {
          soldeDisponible: { increment: montantRembourse },
        },
      });

      // 3. Créer une transaction wallet pour traçabilité
      await tx.transactionWallet.create({
        data: {
          walletId: wallet.id,
          montant: montantRembourse,
          sens: SensTransaction.CREDIT,
          type: TypeTransactionWallet.REMBOURSEMENT,
          reservationId,
          description: `Remboursement ${percentage}% suite à litige - Réservation ${reservationId}`,
          soldeApres: wallet.soldeDisponible,
        },
      });

      // 4. Créer un historique
      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut,
          nouveauStatut: reservation.statut,
          modifiePar: 'SYSTEM_REFUND',
          raison: `Remboursement ${percentage}% effectué (${montantRembourse.toFixed(2)} FCFA)`,
        },
      });

      this.logger.log(
        `Remboursement de ${montantRembourse.toFixed(2)} FCFA (${percentage}%) effectué pour la réservation ${reservationId}. ` +
        `Wallet locataire ${reservation.locataireId} crédité.`
      );
    }, { isolationLevel: 'Serializable' });

    // TODO: déclencher le remboursement financier réel selon le fournisseur
    // PayDunya : await this.paydunya.refund({ token: paiement.transactionId, amount: montantRembourse })
    // Stripe   : await this.stripe.refunds.create({ charge: paiement.transactionId, amount: montantRembourse })
    // Wave/Orange Money : API de remboursement
    this.logger.warn(
      `[TODO] Remboursement financier externe en attente pour résa ${reservationId} ` +
      `(fournisseur: ${paiement.fournisseur}, montant: ${montantRembourse.toFixed(2)} FCFA) — à connecter avec les clés API.`
    );
  }
}
