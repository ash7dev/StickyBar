import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ResultatAnnulation,
  StatutPaiement,
  StatutRefund,
  TypeTransactionTeranga,
  TypeTransactionWallet,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SystemLedgerService } from '../../system-ledger/system-ledger.service';
import { creditWallet, debitWallet } from '../../wallet/wallet-moves';
import { paidOf, postPayoutShares, retainedSplit, splitRefund, type Paid } from '../refund-plan';

export interface RefundRequest {
  /** Montant à rendre au locataire (plafonné à ce qu'il a payé, moins ce qui a déjà été rendu). */
  montant: number;
  motif: ResultatAnnulation;
  declenchePar: string;
  /** Où se trouve l'argent : encore bloqué chez Paixi, ou déjà versé à l'hôte. */
  source?: 'SEQUESTRE' | 'APRES_VERSEMENT';
  montantPenaliteProprio?: number;
  montantCommissionPaixi?: number;
}

export interface RefundResult {
  refundId: string | null;
  cash: number;
  coins: number;
  paid: Paid;
}

/**
 * Exécute un remboursement au locataire, toujours dans la transaction de l'appelant :
 * - la part payée en argent est créditée sur son portefeuille Paixi (retirable vers Wave / Orange Money) ;
 * - la part payée en coins est recréditée en coins, jamais en argent ;
 * - le grand livre et la fiche Refund sont tenus au même moment.
 *
 * Quand les clés du fournisseur de paiement seront disponibles, le remboursement vers le moyen de
 * paiement d'origine remplacera le crédit portefeuille ici, et nulle part ailleurs.
 */
@Injectable()
export class RefundPaymentUseCase {
  private readonly logger = new Logger(RefundPaymentUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLedger: SystemLedgerService,
  ) {}

  /** Raccourci hors transaction (remboursement intégral de ce qui reste, ex. relance admin). */
  async execute(reservationId: string, req: RefundRequest): Promise<RefundResult> {
    return this.prisma.$transaction((tx) => this.refundInTx(tx, reservationId, req), { isolationLevel: 'Serializable' });
  }

  /**
   * Remboursement à n'importe quel moment du séjour :
   * - argent encore bloqué → remboursé depuis le séquestre ; si la réservation se termine là (`cloture`),
   *   la part non remboursée est répartie (frais Paixi d'abord, le reste à l'hôte) ;
   * - séjour déjà versé à l'hôte → l'hôte rend sa part au prorata (solde puis dette), Paixi rend ses frais.
   */
  async refundAnyStageInTx(
    tx: Prisma.TransactionClient,
    reservationId: string,
    req: RefundRequest & { cloture: boolean },
  ): Promise<RefundResult & { repriseHote: number; repriseFraisPaixi: number }> {
    const versement = await tx.transactionWallet.findFirst({
      where: { reservationId, type: TypeTransactionWallet.CREDIT_LOCATION },
      select: { montant: true, wallet: { select: { utilisateurId: true } } },
    });

    if (versement) {
      const res = await this.refundInTx(tx, reservationId, { ...req, source: 'APRES_VERSEMENT' });
      const shares = postPayoutShares(res.paid, res.cash + res.coins, Number(versement.montant));
      await debitWallet(tx, {
        utilisateurId: versement.wallet.utilisateurId,
        reservationId,
        montant: shares.host,
        type: TypeTransactionWallet.DEBIT_PENALITE,
        description: `Reprise : remboursement du voyageur — résa ${reservationId.slice(0, 8).toUpperCase()}`,
      });
      await this.systemLedger.recordCommissionReversal(tx, reservationId, shares.paixi);
      return { ...res, repriseHote: shares.host, repriseFraisPaixi: shares.paixi };
    }

    const res = await this.refundInTx(tx, reservationId, { ...req, source: 'SEQUESTRE' });
    if (req.cloture) {
      const paiement = await tx.paiement.findUnique({ where: { reservationId }, select: { statut: true, montantRembourse: true } });
      // Seulement si l'argent a bien été encaissé
      if (paiement && paiement.statut !== StatutPaiement.EN_ATTENTE && paiement.statut !== StatutPaiement.ECHOUE) {
        const { host, paixi } = retainedSplit(res.paid, Number(paiement.montantRembourse ?? 0));
        const proprio = await tx.reservation.findUnique({ where: { id: reservationId }, select: { proprietaireId: true } });
        if (host > 0 && proprio) {
          await creditWallet(tx, {
            utilisateurId: proprio.proprietaireId,
            reservationId,
            montant: host,
            type: TypeTransactionWallet.CREDIT_LOCATION,
            description: `Part non remboursée au voyageur — résa ${reservationId.slice(0, 8).toUpperCase()}`,
          });
        }
        if (host > 0 || paixi > 0) await this.systemLedger.recordCheckinRelease(tx, reservationId, host, paixi);
      }
    }
    return { ...res, repriseHote: 0, repriseFraisPaixi: 0 };
  }

  async refundInTx(tx: Prisma.TransactionClient, reservationId: string, req: RefundRequest): Promise<RefundResult> {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        locataireId: true,
        totalLocataire: true,
        montantAcompte: true,
        montantPayeCash: true,
        coinsDeduites: true,
        montantCommission: true,
        paiement: { select: { id: true, statut: true, fournisseur: true, montantRembourse: true } },
      },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const paid = paidOf(reservation);
    const paiement = reservation.paiement;
    // Rien n'a été encaissé : rien à rendre
    if (!paiement || (paiement.statut !== StatutPaiement.CONFIRME && paiement.statut !== StatutPaiement.GELE)) {
      return { refundId: null, cash: 0, coins: 0, paid };
    }

    const dejaRendu = Number(paiement.montantRembourse ?? 0);
    const montant = Math.max(0, Math.min(Math.round(req.montant), paid.total - dejaRendu));
    if (montant === 0) return { refundId: null, cash: 0, coins: 0, paid };

    const deja = await tx.transactionWallet.findFirst({
      where: { reservationId, type: TypeTransactionWallet.REMBOURSEMENT },
      select: { id: true },
    });
    if (deja) {
      // Un seul remboursement par réservation : un complément passe par un ajustement admin tracé
      throw new ConflictException('Un remboursement a déjà été versé pour cette réservation');
    }

    const { cash, coins } = splitRefund(paid, montant);

    if (cash > 0) {
      await creditWallet(tx, {
        utilisateurId: reservation.locataireId,
        reservationId,
        montant: cash,
        type: TypeTransactionWallet.REMBOURSEMENT,
        description: `Remboursement — résa ${reservationId.slice(0, 8).toUpperCase()}`,
      });
    }

    if (coins > 0) {
      const account = await tx.terangaAccount.findUnique({ where: { utilisateurId: reservation.locataireId } });
      if (account) {
        const soldeApres = account.soldeCoins + coins;
        await tx.terangaAccount.update({ where: { id: account.id }, data: { soldeCoins: soldeApres } });
        await tx.terangaTransaction.create({
          data: {
            terangaAccountId: account.id,
            montantCoins: coins,
            type: TypeTransactionTeranga.CREDIT_ANNULATION,
            description: `Paixi Coins rendus — résa ${reservationId.slice(0, 8).toUpperCase()}`,
            reservationId,
            soldeApres,
          },
        });
      }
    }

    await this.systemLedger.recordRefund(tx, reservationId, cash, coins, req.source ?? 'SEQUESTRE');

    const totalRendu = dejaRendu + montant;
    await tx.paiement.update({
      where: { id: paiement.id },
      data: {
        montantRembourse: totalRendu,
        rembourseLe: new Date(),
        ...(totalRendu >= paid.total && { statut: StatutPaiement.REMBOURSE }),
      },
    });

    const refund = await tx.refund.create({
      data: {
        reservationId,
        paiementId: paiement.id,
        motif: req.motif,
        montantTotal: montant,
        montantLocataire: cash,
        montantPenaliteProprio: req.montantPenaliteProprio ?? 0,
        montantCommissionImmoLoc: req.montantCommissionPaixi ?? 0,
        declenchePar: req.declenchePar,
        statut: StatutRefund.EXECUTE,
        executeLe: new Date(),
        methodeRemboursement: paiement.fournisseur,
        idTransactionRefund: `PORTEFEUILLE-${reservationId.slice(0, 8).toUpperCase()}`,
      },
    });

    this.logger.log(
      `Remboursement résa ${reservationId} : ${cash} FCFA sur le portefeuille + ${coins} coins (payé ${paid.total})`,
    );
    return { refundId: refund.id, cash, coins, paid };
  }
}
