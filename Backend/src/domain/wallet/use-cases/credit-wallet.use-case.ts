import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SensTransaction, TypeTransactionWallet } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class CreditWalletUseCase {
  private readonly logger = new Logger(CreditWalletUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(reservationId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: { proprietaireId: true, netProprietaire: true },
      });

      if (!reservation) throw new NotFoundException('Réservation introuvable');

      // Idempotence garantie par @@unique([reservationId, type])
      const alreadyCredited = await tx.transactionWallet.findUnique({
        where: {
          reservationId_type: {
            reservationId,
            type: TypeTransactionWallet.CREDIT_LOCATION,
          },
        },
      });

      if (alreadyCredited) {
        this.logger.warn(`CreditWallet déjà exécuté pour réservation ${reservationId} — skip`);
        return;
      }

      const wallet = await tx.wallet.findUnique({
        where: { utilisateurId: reservation.proprietaireId },
      });

      if (!wallet) {
        throw new NotFoundException(
          `Wallet introuvable pour propriétaire ${reservation.proprietaireId}`,
        );
      }

      const montantBrut = Number(reservation.netProprietaire);
      const dette = Number(wallet.dettePenalites);
      const aDeduire = dette > 0 ? Math.min(montantBrut, dette) : 0;
      const montantNet = montantBrut - aDeduire;
      const soldeInitial = Number(wallet.soldeDisponible);
      const soldeApresCredit = soldeInitial + montantNet;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          soldeDisponible: { increment: montantNet },
          ...(aDeduire > 0 && { dettePenalites: { decrement: aDeduire } }),
        },
      });

      // DEBIT_DETTE : dette soldée par interception du crédit entrant (solde inchangé)
      if (aDeduire > 0) {
        await tx.transactionWallet.create({
          data: {
            walletId: wallet.id,
            reservationId,
            type: TypeTransactionWallet.DEBIT_DETTE,
            montant: aDeduire,
            sens: SensTransaction.DEBIT,
            soldeApres: soldeInitial,
            description: `Déduction automatique dette pénalité — résa ${reservationId}`,
          },
        });
      }

      // CREDIT_LOCATION : montant brut en label, montantNet effectivement crédité
      await tx.transactionWallet.create({
        data: {
          walletId: wallet.id,
          reservationId,
          type: TypeTransactionWallet.CREDIT_LOCATION,
          montant: montantBrut,
          sens: SensTransaction.CREDIT,
          soldeApres: soldeApresCredit,
          description:
            `Revenu location — résa ${reservationId}` +
            (aDeduire > 0
              ? ` (dette déduite : ${aDeduire.toLocaleString('fr-FR')} FCFA)`
              : ''),
        },
      });

      this.logger.log(
        `Wallet crédité [proprio: ${reservation.proprietaireId}] ` +
        `+${montantNet.toLocaleString('fr-FR')} FCFA` +
        (aDeduire > 0 ? ` | dette déduite : ${aDeduire} FCFA` : ''),
      );
    }, { isolationLevel: 'Serializable' });
  }
}
