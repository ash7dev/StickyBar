import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SensTransaction, TypeTransactionWallet } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AwardBookingCashbackUseCase } from '../../teranga-club/use-cases/award-booking-cashback.use-case';
import { SystemLedgerService } from '../../system-ledger/system-ledger.service';

@Injectable()
export class CreditWalletUseCase {
  private readonly logger = new Logger(CreditWalletUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLedger: SystemLedgerService,
  ) {}

  async execute(reservationId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: {
          proprietaireId: true,
          locataireId: true,
          netProprietaire: true,
          montantCommission: true,
          typePaiement: true,
          montantAcompte: true,
          montantPayeCash: true,
          subventionKlef: true,
        },
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

      // Pour DEPOSIT : l'acompte encaisse (ex: 70,6K FCFA) contient la commission Klef (ex: 15,4K FCFA).
      // Le net crédité au portefeuille du propriétaire = acompte - commission Klef.
      // Le solde restant du séjour est payé en espèces au propriétaire à l'arrivée.
      const isDeposit = reservation.typePaiement?.toUpperCase() === 'DEPOSIT';
      const commNum = Number(reservation.montantCommission || 0);
      const montantBrut = isDeposit
        ? Math.max(0, Number(reservation.montantAcompte || 0) - commNum)
        : Number(reservation.netProprietaire || 0);
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
      const labelType = isDeposit ? 'Acompte' : 'Totalité';
      await tx.transactionWallet.create({
        data: {
          walletId: wallet.id,
          reservationId,
          type: TypeTransactionWallet.CREDIT_LOCATION,
          montant: montantBrut,
          sens: SensTransaction.CREDIT,
          soldeApres: soldeApresCredit,
          description:
            `Revenu location (${labelType}) — résa ${reservationId.slice(0, 8).toUpperCase()}` +
            (aDeduire > 0
              ? ` (dette déduite : ${aDeduire.toLocaleString('fr-FR')} FCFA)`
              : ''),
        },
      });

      // Libération des fonds depuis le Grand Livre Système Klef
      const hostEscrowPayout = isDeposit
        ? Math.max(0, Number(reservation.montantAcompte || 0) - commNum)
        : Number(reservation.netProprietaire || 0);

      await this.systemLedger.recordCheckinRelease(
        tx,
        reservationId,
        hostEscrowPayout,
        commNum,
      );

      this.logger.log(
        `Wallet crédité [proprio: ${reservation.proprietaireId}] ` +
        `+${montantNet.toLocaleString('fr-FR')} FCFA` +
        (aDeduire > 0 ? ` | dette déduite : ${aDeduire} FCFA` : ''),
      );

      // Crédit automatique des Klef Coins pour le locataire via Teranga Club
      try {
        const awardUseCase = new AwardBookingCashbackUseCase(this.prisma);
        const coinsGagnes = await awardUseCase.execute(reservationId);
        if (coinsGagnes > 0) {
          this.logger.log(`Klef Coins crédités [locataire: ${reservation.locataireId}] +${coinsGagnes} Coins`);
        }
      } catch (terangaErr) {
        this.logger.warn(`Erreur lors du crédit Teranga Coins pour la résa ${reservationId}: ${(terangaErr as Error).message}`);
      }
    }, { isolationLevel: 'Serializable' });
  }
}
