import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Prisma, SensTransaction, TypeTransactionSysteme } from '@prisma/client';

export const SYSTEM_LEDGER_SINGLETON_ID = 'KLEF_SYSTEM_LEDGER_SINGLETON';

@Injectable()
export class SystemLedgerService {
  private readonly logger = new Logger(SystemLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures the singleton SystemLedger row exists in the database
   */
  async ensureLedgerExists(tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx || this.prisma;
    let ledger = await client.systemLedger.findUnique({
      where: { id: SYSTEM_LEDGER_SINGLETON_ID },
    });

    if (!ledger) {
      ledger = await client.systemLedger.create({
        data: {
          id: SYSTEM_LEDGER_SINGLETON_ID,
          soldeSequestre: 0,
          soldeCommissionsCumulees: 0,
          soldePoolTeranga: 10000000, // 10 Million FCFA initial allocation for loyalty marketing pool
        },
      });
      this.logger.log('Initialisé le Grand Livre Système Klef (Singleton)');
    }

    return ledger;
  }

  /**
   * Encaissements & Subvention Teranga lors de la création d'une réservation
   */
  async recordEncaissementSequestre(
    tx: Prisma.TransactionClient,
    reservationId: string,
    cashAmount: number,
    subsidyAmount: number,
    descriptionSuffix = '',
  ) {
    await this.ensureLedgerExists(tx);
    const totalAdded = cashAmount + subsidyAmount;

    const ledger = await tx.systemLedger.update({
      where: { id: SYSTEM_LEDGER_SINGLETON_ID },
      data: {
        soldeSequestre: { increment: totalAdded },
        soldePoolTeranga: subsidyAmount > 0 ? { decrement: subsidyAmount } : undefined,
      },
    });

    const soldeApres = Number(ledger.soldeSequestre);

    if (cashAmount > 0) {
      await tx.transactionSystemLedger.create({
        data: {
          reservationId,
          type: TypeTransactionSysteme.ENCAISSEMENT_SEQUESTRE_CASH,
          montant: cashAmount,
          sens: SensTransaction.CREDIT,
          soldeSequestreApres: soldeApres,
          description: `Encaissement FCFA Mobile Money (${cashAmount.toLocaleString('fr-FR')} FCFA) ${descriptionSuffix}`.trim(),
        },
      });
    }

    if (subsidyAmount > 0) {
      await tx.transactionSystemLedger.create({
        data: {
          reservationId,
          type: TypeTransactionSysteme.SUBVENTION_TERANGA_INJECTEE,
          montant: subsidyAmount,
          sens: SensTransaction.CREDIT,
          soldeSequestreApres: soldeApres,
          description: `Subvention Klef Coins injectée dans le séquestre (${subsidyAmount.toLocaleString('fr-FR')} FCFA) ${descriptionSuffix}`.trim(),
        },
      });
    }

    return ledger;
  }

  /**
   * Libération des fonds au Check-in / Clôture :
   * Transfert vers le Wallet de l'Hôte + Reconnaissance de la Commission Klef
   */
  async recordCheckinRelease(
    tx: Prisma.TransactionClient,
    reservationId: string,
    hostPayoutFromEscrow: number,
    platformCommission: number,
  ) {
    await this.ensureLedgerExists(tx);
    const totalReleased = hostPayoutFromEscrow + platformCommission;

    const ledger = await tx.systemLedger.update({
      where: { id: SYSTEM_LEDGER_SINGLETON_ID },
      data: {
        soldeSequestre: { decrement: totalReleased },
        soldeCommissionsCumulees: { increment: platformCommission },
      },
    });

    const soldeApres = Number(ledger.soldeSequestre);

    if (hostPayoutFromEscrow > 0) {
      await tx.transactionSystemLedger.create({
        data: {
          reservationId,
          type: TypeTransactionSysteme.REVERSEMENT_PROPRIETAIRE,
          montant: hostPayoutFromEscrow,
          sens: SensTransaction.DEBIT,
          soldeSequestreApres: soldeApres,
          description: `Libération du séquestre vers le Wallet Hôte (${hostPayoutFromEscrow.toLocaleString('fr-FR')} FCFA)`,
        },
      });
    }

    if (platformCommission > 0) {
      await tx.transactionSystemLedger.create({
        data: {
          reservationId,
          type: TypeTransactionSysteme.COMMISSION_ACQUISE,
          montant: platformCommission,
          sens: SensTransaction.DEBIT,
          soldeSequestreApres: soldeApres,
          description: `Acquisition de la commission Klef (${platformCommission.toLocaleString('fr-FR')} FCFA)`,
        },
      });
    }

    return ledger;
  }

  /**
   * Remboursement lors d'une annulation
   */
  async recordRefund(
    tx: Prisma.TransactionClient,
    reservationId: string,
    cashRefund: number,
    coinsRefund: number,
  ) {
    await this.ensureLedgerExists(tx);

    const ledger = await tx.systemLedger.update({
      where: { id: SYSTEM_LEDGER_SINGLETON_ID },
      data: {
        soldeSequestre: { decrement: cashRefund },
        soldePoolTeranga: coinsRefund > 0 ? { increment: coinsRefund } : undefined,
      },
    });

    const soldeApres = Number(ledger.soldeSequestre);

    if (cashRefund > 0) {
      await tx.transactionSystemLedger.create({
        data: {
          reservationId,
          type: TypeTransactionSysteme.REMBOURSEMENT_LOCATAIRE_CASH,
          montant: cashRefund,
          sens: SensTransaction.DEBIT,
          soldeSequestreApres: soldeApres,
          description: `Remboursement FCFA Mobile Money au locataire (${cashRefund.toLocaleString('fr-FR')} FCFA)`,
        },
      });
    }

    if (coinsRefund > 0) {
      await tx.transactionSystemLedger.create({
        data: {
          reservationId,
          type: TypeTransactionSysteme.REMBOURSEMENT_LOCATAIRE_COINS,
          montant: coinsRefund,
          sens: SensTransaction.CREDIT,
          soldeSequestreApres: soldeApres,
          description: `Recrédit de ${coinsRefund.toLocaleString('fr-FR')} Klef Coins au locataire`,
        },
      });
    }

    return ledger;
  }

  /**
   * Obtient l'état courant de la trésorerie plateforme Klef
   * Calcule dynamiquement le séquestre réel, le cumul des commissions et le pool Teranga
   */
  async getLedgerSummary() {
    const ledger = await this.ensureLedgerExists();

    const [pendingEscrowDeposit, pendingEscrowFull, checkedInCommissions, totalPenalties, totalSubventions] = await Promise.all([
      this.prisma.reservation.aggregate({
        where: { statut: { in: ['PAID', 'CONFIRMED'] }, typePaiement: 'DEPOSIT' },
        _sum: { montantAcompte: true },
      }),
      this.prisma.reservation.aggregate({
        where: { statut: { in: ['PAID', 'CONFIRMED'] }, typePaiement: 'FULL' },
        _sum: { totalLocataire: true },
      }),
      this.prisma.reservation.aggregate({
        where: { statut: { in: ['CHECKED_IN', 'COMPLETED'] } },
        _sum: { montantCommission: true },
      }),
      this.prisma.transactionWallet.aggregate({
        where: { type: 'DEBIT_PENALITE' },
        _sum: { montant: true },
      }),
      this.prisma.reservation.aggregate({
        where: { subventionKlef: { gt: 0 } },
        _sum: { subventionKlef: true },
      }),
    ]);

    const realSequestre = Number(pendingEscrowDeposit._sum.montantAcompte || 0) + Number(pendingEscrowFull._sum.totalLocataire || 0) + Number(ledger.soldeSequestre);
    const realCommissions = Number(checkedInCommissions._sum.montantCommission || 0) + Number(totalPenalties._sum.montant || 0) + Number(ledger.soldeCommissionsCumulees);
    const INITIAL_POOL = 10000000;
    const realPool = INITIAL_POOL - Number(totalSubventions._sum.subventionKlef || 0);

    return {
      soldeSequestre: Math.max(0, realSequestre),
      soldeCommissionsCumulees: Math.max(0, realCommissions),
      soldePoolTeranga: Math.max(0, realPool),
    };
  }
}
