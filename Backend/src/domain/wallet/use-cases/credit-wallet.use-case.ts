import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SensTransaction, TypeTransactionWallet } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AwardBookingCashbackUseCase } from '../../teranga-club/use-cases/award-booking-cashback.use-case';
import { SystemLedgerService } from '../../system-ledger/system-ledger.service';
import { checkinPayout, paidOf } from '../../payment/refund-plan';

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
          totalLocataire: true,
          montantAcompte: true,
          montantPayeCash: true,
          coinsDeduites: true,
          subventionKlef: true,
          paiement: { select: { montantRembourse: true } },
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

      // Ce que Paixi a encaissé (acompte ou totalité), moins un éventuel remboursement partiel
      // décidé avant l'arrivée ; les frais Paixi sont prélevés en premier, l'hôte reçoit le reste.
      // Avec un acompte, le solde du séjour est payé en espèces à l'hôte à l'arrivée.
      const isDeposit = reservation.typePaiement?.toUpperCase() === 'DEPOSIT';
      const payout = checkinPayout(paidOf(reservation), Number(reservation.paiement?.montantRembourse ?? 0));
      const commNum = payout.paixi;
      const montantBrut = payout.host;
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

      // Libération des fonds depuis le Grand Livre Système Paixi
      const hostEscrowPayout = montantBrut;

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

      // Paixi Coins du locataire, dans la même transaction : pas de coins si le versement échoue
      const awardUseCase = new AwardBookingCashbackUseCase(tx as never);
      const coinsGagnes = await awardUseCase.execute(reservationId);
      if (coinsGagnes > 0) {
        this.logger.log(`Paixi Coins crédités [locataire: ${reservation.locataireId}] +${coinsGagnes} Coins`);
      }
    }, { isolationLevel: 'Serializable' });
  }
}
