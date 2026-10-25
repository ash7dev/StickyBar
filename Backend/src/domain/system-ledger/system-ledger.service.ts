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
      this.logger.log('Initialisé le Grand Livre Système Paixi (Singleton)');
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
          description: `Subvention Paixi Coins injectée dans le séquestre (${subsidyAmount.toLocaleString('fr-FR')} FCFA) ${descriptionSuffix}`.trim(),
        },
      });
    }

    return ledger;
  }

  /**
   * Libération des fonds au Check-in / Clôture :
   * Transfert vers le Wallet de l'Hôte + Reconnaissance de la Commission Paixi
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
          description: `Acquisition de la commission Paixi (${platformCommission.toLocaleString('fr-FR')} FCFA)`,
        },
      });
    }

    return ledger;
  }

  /**
   * Remboursement au locataire.
   * - SEQUESTRE : l'argent était encore bloqué (annulation, litige avant versement) ; la part
   *   coins sort aussi du séquestre et retourne dans la réserve Teranga.
   * - APRES_VERSEMENT : le séjour avait déjà été versé à l'hôte ; le séquestre n'est plus concerné
   *   (l'hôte et Paixi rendent leur part, voir recordCommissionReversal).
   */
  async recordRefund(
    tx: Prisma.TransactionClient,
    reservationId: string,
    cashRefund: number,
    coinsRefund: number,
    source: 'SEQUESTRE' | 'APRES_VERSEMENT' = 'SEQUESTRE',
  ) {
    await this.ensureLedgerExists(tx);

    const fromEscrow = source === 'SEQUESTRE' ? cashRefund + coinsRefund : 0;
    const ledger = await tx.systemLedger.update({
      where: { id: SYSTEM_LEDGER_SINGLETON_ID },
      data: {
        ...(fromEscrow > 0 && { soldeSequestre: { decrement: fromEscrow } }),
        ...(coinsRefund > 0 && { soldePoolTeranga: { increment: coinsRefund } }),
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
          description: `Recrédit de ${coinsRefund.toLocaleString('fr-FR')} Paixi Coins au locataire`,
        },
      });
    }

    return ledger;
  }

  /**
   * Revenus Paixi rendus au locataire (frais de service remboursés après un litige fondé).
   */
  async recordCommissionReversal(tx: Prisma.TransactionClient, reservationId: string, amount: number) {
    if (amount <= 0) return;
    await this.ensureLedgerExists(tx);
    const ledger = await tx.systemLedger.update({
      where: { id: SYSTEM_LEDGER_SINGLETON_ID },
      data: { soldeCommissionsCumulees: { decrement: amount } },
    });
    await tx.transactionSystemLedger.create({
      data: {
        reservationId,
        type: TypeTransactionSysteme.COMMISSION_ACQUISE,
        montant: amount,
        sens: SensTransaction.CREDIT,
        soldeSequestreApres: Number(ledger.soldeSequestre),
        description: `Frais Paixi rendus au locataire après litige (${amount.toLocaleString('fr-FR')} FCFA)`,
      },
    });
  }

  /**
   * Pénalité d'annulation de l'hôte : revenu Paixi (déduite de son portefeuille ou de ses prochains versements).
   */
  async recordOwnerPenalty(tx: Prisma.TransactionClient, reservationId: string, amount: number) {
    if (amount <= 0) return;
    await this.ensureLedgerExists(tx);
    const ledger = await tx.systemLedger.update({
      where: { id: SYSTEM_LEDGER_SINGLETON_ID },
      data: { soldeCommissionsCumulees: { increment: amount } },
    });
    await tx.transactionSystemLedger.create({
      data: {
        reservationId,
        type: TypeTransactionSysteme.COMMISSION_ACQUISE,
        montant: amount,
        sens: SensTransaction.DEBIT,
        soldeSequestreApres: Number(ledger.soldeSequestre),
        description: `Pénalité d'annulation hôte (${amount.toLocaleString('fr-FR')} FCFA)`,
      },
    });
  }

  /**
   * Obtient l'état courant de la trésorerie plateforme Paixi
   * Calcule dynamiquement le séquestre réel, le cumul des commissions et le pool Teranga
   */
  async getLedgerSummary() {
    const ledger = await this.ensureLedgerExists();

    // Le grand livre est tenu à chaque mouvement : c'est la source de vérité.
    // Le contrôle recalcule l'argent bloqué depuis les réservations pour repérer un écart.
    const [encaisse, rembourse, verse] = await Promise.all([
      this.prisma.transactionSystemLedger.aggregate({
        where: { type: { in: [TypeTransactionSysteme.ENCAISSEMENT_SEQUESTRE_CASH, TypeTransactionSysteme.SUBVENTION_TERANGA_INJECTEE] } },
        _sum: { montant: true },
      }),
      this.prisma.transactionSystemLedger.aggregate({
        where: { type: { in: [TypeTransactionSysteme.REMBOURSEMENT_LOCATAIRE_CASH, TypeTransactionSysteme.REMBOURSEMENT_LOCATAIRE_COINS] } },
        _sum: { montant: true },
      }),
      this.prisma.transactionSystemLedger.aggregate({
        where: { type: TypeTransactionSysteme.REVERSEMENT_PROPRIETAIRE },
        _sum: { montant: true },
      }),
    ]);

    return {
      soldeSequestre: Number(ledger.soldeSequestre),
      soldeCommissionsCumulees: Number(ledger.soldeCommissionsCumulees),
      soldePoolTeranga: Number(ledger.soldePoolTeranga),
      controle: {
        encaisse: Number(encaisse._sum.montant ?? 0),
        rembourse: Number(rembourse._sum.montant ?? 0),
        verseAuxHotes: Number(verse._sum.montant ?? 0),
      },
    };
  }
}
