import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ResultatAnnulation, StatutRefund, Prisma } from '@prisma/client';

/**
 * USE CASE: Process Refund
 *
 * Calcule et exécute un remboursement selon la politique d'annulation
 * - USE CASE 1: Locataire annule — Réservation NON confirmée (PAID)
 * - USE CASE 2: Locataire annule — Réservation CONFIRMÉE
 * - USE CASE 3: Proprio annule — Réservation PAYÉE (pas confirmée)
 * - USE CASE 4: Proprio annule — Réservation CONFIRMÉE/EN_COURS
 *
 * @see https://docs.immoloc.com/refund-policy
 */

export interface RefundCalculation {
  motif: ResultatAnnulation;
  montantTotal: number;
  montantLocataire: number;
  montantPenaliteProprio: number;
  montantCommissionImmoLoc: number;
  details: string;
}

@Injectable()
export class ProcessRefundUseCase {
  private readonly logger = new Logger(ProcessRefundUseCase.name);

  // Commission ImmoLoc: 7%
  private readonly COMMISSION_RATE = 0.07;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Détermine le résultat d'annulation selon le contexte
   *
   * @param reservationId - ID de la réservation
   * @param annulePar - 'LOCATAIRE' | 'PROPRIETAIRE'
   * @returns ResultatAnnulation
   */
  async determineResultatAnnulation(
    reservationId: string,
    annulePar: 'LOCATAIRE' | 'PROPRIETAIRE',
  ): Promise<RefundCalculation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { paiement: true },
    });

    if (!reservation) {
      throw new Error('Réservation introuvable');
    }

    const { statut, confirmeeLe, dateDebut, totalLocataire, totalBase } = reservation;
    const now = new Date();
    const checkInDate = new Date(dateDebut);
    const heuresAvantCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const joursAvantCheckIn = heuresAvantCheckIn / 24;

    this.logger.log(
      `Calcul remboursement: ${annulePar} annule, statut=${statut}, confirmeeLe=${confirmeeLe}, ${joursAvantCheckIn.toFixed(1)} jours avant check-in`,
    );

    // ========================================================================
    // LOCATAIRE ANNULE
    // ========================================================================
    if (annulePar === 'LOCATAIRE') {
      // USE CASE 1: Réservation NON confirmée (PAID seulement)
      if (statut === 'PAID' && !confirmeeLe) {
        return this.calculateUC1_LocataireNonConfirmee(totalLocataire);
      }

      // USE CASE 2: Réservation CONFIRMÉE
      if (statut === 'CONFIRMED' || (statut === 'PAID' && confirmeeLe)) {
        // < 24h: Annulation bloquée
        if (heuresAvantCheckIn < 24) {
          throw new Error(
            'Annulation impossible moins de 24h avant le check-in. Veuillez contacter le support.',
          );
        }

        // > 3 jours
        if (joursAvantCheckIn > 3) {
          return this.calculateUC2_LocatairePlus3J(totalLocataire, totalBase);
        }

        // 1-3 jours
        if (joursAvantCheckIn >= 1) {
          return this.calculateUC2_Locataire1_3J(totalLocataire, totalBase);
        }

        // Cas non géré (ne devrait jamais arriver)
        throw new Error('Cas d\'annulation non géré');
      }
    }

    // ========================================================================
    // PROPRIETAIRE ANNULE
    // ========================================================================
    if (annulePar === 'PROPRIETAIRE') {
      // USE CASE 3: Réservation PAYÉE mais pas confirmée = REFUS
      if (statut === 'PAID' && !confirmeeLe) {
        return this.calculateUC3_ProprioRefuse(totalLocataire);
      }

      // USE CASE 4: Réservation CONFIRMÉE ou EN_COURS
      if (statut === 'CONFIRMED' || statut === 'CHECKED_IN' || (statut === 'PAID' && confirmeeLe)) {
        // Jour même (< 24h): BLOQUÉ
        if (heuresAvantCheckIn < 24) {
          throw new Error(
            'Annulation le jour même impossible. Cette action nécessite une intervention manuelle de l\'administrateur.',
          );
        }

        // > 7 jours
        if (joursAvantCheckIn > 7) {
          return this.calculateUC4_ProprioPlus7J(totalLocataire, totalBase);
        }

        // 3-7 jours
        if (joursAvantCheckIn >= 3) {
          return this.calculateUC4_Proprio3_7J(totalLocataire, totalBase);
        }

        // < 3 jours
        if (joursAvantCheckIn >= 1) {
          return this.calculateUC4_ProprioMoins3J(totalLocataire, totalBase);
        }
      }
    }

    throw new Error(`Impossible de déterminer la politique d'annulation pour cette réservation`);
  }

  // ==========================================================================
  // USE CASE 1: Locataire annule — Réservation NON confirmée
  // ==========================================================================
  private calculateUC1_LocataireNonConfirmee(totalLocataire: Prisma.Decimal): RefundCalculation {
    const total = Number(totalLocataire);

    return {
      motif: 'UC1_LOCATAIRE_NON_CONFIRMEE',
      montantTotal: total,
      montantLocataire: total, // 100% remboursé (commission incluse)
      montantPenaliteProprio: 0,
      montantCommissionImmoLoc: 0, // ImmoLoc perd la commission
      details: 'Réservation non confirmée par le propriétaire - Remboursement intégral (100%)',
    };
  }

  // ==========================================================================
  // USE CASE 2: Locataire annule — Réservation CONFIRMÉE
  // ==========================================================================

  /**
   * > 3 jours avant check-in
   * - Remboursement: 100% du totalBase (sans commission)
   * - Commission ImmoLoc: 7% (retenue)
   */
  private calculateUC2_LocatairePlus3J(
    totalLocataire: Prisma.Decimal,
    totalBase: Prisma.Decimal,
  ): RefundCalculation {
    const base = Number(totalBase);
    const commission = Number(totalLocataire) - base;

    return {
      motif: 'UC2_LOCATAIRE_PLUS_3J',
      montantTotal: base,
      montantLocataire: base, // Remboursement sans commission
      montantPenaliteProprio: 0,
      montantCommissionImmoLoc: commission, // ImmoLoc garde 7%
      details: `Annulation > 3 jours - Remboursement ${base.toFixed(0)} FCFA (commission ${commission.toFixed(0)} FCFA retenue)`,
    };
  }

  /**
   * 1-3 jours avant check-in
   * - Remboursement locataire: 75% du totalLocataire
   * - Commission ImmoLoc: 7%
   * - Resto (~18%): va au proprio comme compensation
   */
  private calculateUC2_Locataire1_3J(
    totalLocataire: Prisma.Decimal,
    totalBase: Prisma.Decimal,
  ): RefundCalculation {
    const total = Number(totalLocataire);
    const base = Number(totalBase);
    const remboursement = total * 0.75;
    const commission = total * this.COMMISSION_RATE;
    const compensationProprio = total - remboursement - commission;

    return {
      motif: 'UC2_LOCATAIRE_1_3J',
      montantTotal: remboursement,
      montantLocataire: remboursement, // 75% du totalLocataire
      montantPenaliteProprio: 0,
      montantCommissionImmoLoc: commission + compensationProprio, // 7% + ~18%
      details: `Annulation 1-3 jours - Remboursement ${remboursement.toFixed(0)} FCFA (75%), commission ${commission.toFixed(0)} FCFA, proprio reçoit ${compensationProprio.toFixed(0)} FCFA`,
    };
  }

  // ==========================================================================
  // USE CASE 3: Proprio annule — Réservation PAYÉE (refus)
  // ==========================================================================
  private calculateUC3_ProprioRefuse(totalLocataire: Prisma.Decimal): RefundCalculation {
    const total = Number(totalLocataire);

    return {
      motif: 'UC3_PROPRIO_REFUSE',
      montantTotal: total,
      montantLocataire: total, // 100% remboursé (commission incluse)
      montantPenaliteProprio: 0,
      montantCommissionImmoLoc: 0, // ImmoLoc perd la commission
      details: 'Propriétaire refuse la réservation - Remboursement intégral au locataire (100%)',
    };
  }

  // ==========================================================================
  // USE CASE 4: Proprio annule — Réservation CONFIRMÉE
  // ==========================================================================

  /**
   * > 7 jours avant check-in
   * - Remboursement: 100% totalLocataire
   * - Pénalité proprio: 0% (juste avertissement)
   */
  private calculateUC4_ProprioPlus7J(
    totalLocataire: Prisma.Decimal,
    totalBase: Prisma.Decimal,
  ): RefundCalculation {
    const total = Number(totalLocataire);

    return {
      motif: 'UC4_PROPRIO_PLUS_7J',
      montantTotal: total,
      montantLocataire: total, // 100% remboursé
      montantPenaliteProprio: 0, // Juste avertissement
      montantCommissionImmoLoc: 0, // ImmoLoc perd commission
      details: `Annulation proprio > 7 jours - Remboursement intégral ${total.toFixed(0)} FCFA, avertissement au propriétaire`,
    };
  }

  /**
   * 3-7 jours avant check-in
   * - Remboursement: 100% totalLocataire
   * - Pénalité proprio: 20% du totalBase
   */
  private calculateUC4_Proprio3_7J(
    totalLocataire: Prisma.Decimal,
    totalBase: Prisma.Decimal,
  ): RefundCalculation {
    const total = Number(totalLocataire);
    const base = Number(totalBase);
    const penalite = base * 0.2;

    return {
      motif: 'UC4_PROPRIO_3_7J',
      montantTotal: total,
      montantLocataire: total, // 100% remboursé
      montantPenaliteProprio: penalite, // 20% du totalBase
      montantCommissionImmoLoc: 0, // ImmoLoc perd commission
      details: `Annulation proprio 3-7 jours - Remboursement ${total.toFixed(0)} FCFA, pénalité proprio ${penalite.toFixed(0)} FCFA (20%)`,
    };
  }

  /**
   * < 3 jours avant check-in
   * - Remboursement: 100% totalLocataire
   * - Pénalité proprio: 40% du totalBase
   */
  private calculateUC4_ProprioMoins3J(
    totalLocataire: Prisma.Decimal,
    totalBase: Prisma.Decimal,
  ): RefundCalculation {
    const total = Number(totalLocataire);
    const base = Number(totalBase);
    const penalite = base * 0.4;

    return {
      motif: 'UC4_PROPRIO_MOINS_3J',
      montantTotal: total,
      montantLocataire: total, // 100% remboursé
      montantPenaliteProprio: penalite, // 40% du totalBase
      montantCommissionImmoLoc: 0, // ImmoLoc perd commission
      details: `Annulation proprio < 3 jours - Remboursement ${total.toFixed(0)} FCFA, pénalité proprio ${penalite.toFixed(0)} FCFA (40%)`,
    };
  }

  /**
   * Crée un enregistrement Refund dans la base de données
   *
   * @param reservationId - ID de la réservation
   * @param paiementId - ID du paiement
   * @param calculation - Calcul du remboursement
   * @param declenchePar - UserId qui a déclenché l'annulation
   */
  async createRefund(
    reservationId: string,
    paiementId: string,
    calculation: RefundCalculation,
    declenchePar: string,
  ) {
    this.logger.log(`Création Refund: ${calculation.details}`);

    return this.prisma.refund.create({
      data: {
        reservationId,
        paiementId,
        motif: calculation.motif,
        montantTotal: calculation.montantTotal,
        montantLocataire: calculation.montantLocataire,
        montantPenaliteProprio: calculation.montantPenaliteProprio,
        montantCommissionImmoLoc: calculation.montantCommissionImmoLoc,
        declenchePar,
        statut: 'EN_ATTENTE',
      },
    });
  }

  /**
   * Exécute le remboursement (simulation pour l'instant)
   *
   * TODO: Intégrer Wave/Orange Money API
   */
  async executeRefund(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        reservation: true,
        paiement: true,
      },
    });

    if (!refund) {
      throw new Error('Refund introuvable');
    }

    if (refund.statut !== 'EN_ATTENTE') {
      throw new Error(`Refund déjà traité (statut: ${refund.statut})`);
    }

    this.logger.log(`[SIMULATION] Exécution refund #${refundId}`);
    this.logger.log(`  Montant locataire: ${refund.montantLocataire} FCFA`);
    this.logger.log(`  Pénalité proprio: ${refund.montantPenaliteProprio} FCFA`);
    this.logger.log(`  Commission ImmoLoc: ${refund.montantCommissionImmoLoc} FCFA`);

    // TODO: Appeler Wave/Orange Money API ici
    // const transaction = await this.paymentService.refund(...)

    // Simuler succès
    await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        statut: 'EXECUTE',
        executeLe: new Date(),
        methodeRemboursement: refund.paiement.fournisseur,
        idTransactionRefund: `SIMULATION_REFUND_${Date.now()}`,
      },
    });

    // Si pénalité proprio > 0, débiter son wallet
    if (Number(refund.montantPenaliteProprio) > 0) {
      await this.debitProprioWallet(
        refund.reservation.proprietaireId,
        Number(refund.montantPenaliteProprio),
        refund.reservationId,
        refund.motif,
      );
    }

    this.logger.log(`[SIMULATION] Refund #${refundId} exécuté avec succès`);
  }

  /**
   * Débite le wallet du propriétaire pour pénalité
   */
  private async debitProprioWallet(
    proprietaireId: string,
    montantPenalite: number,
    reservationId: string,
    motif: ResultatAnnulation,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // SELECT FOR UPDATE sur le wallet
      const wallet = await tx.$queryRaw<Array<{ id: string; soldeDisponible: number; dettePenalites: number }>>`
        SELECT id, "soldeDisponible", "dettePenalites"
        FROM "Wallet"
        WHERE "utilisateurId" = ${proprietaireId}
        FOR UPDATE
      `.then((rows) => rows[0]);

      if (!wallet) {
        throw new Error('Wallet propriétaire introuvable');
      }

      const solde = Number(wallet.soldeDisponible);
      const dette = Number(wallet.dettePenalites);

      // Si solde suffisant: on débite
      if (solde >= montantPenalite) {
        const nouveauSolde = solde - montantPenalite;

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { soldeDisponible: nouveauSolde },
        });

        await tx.transactionWallet.create({
          data: {
            walletId: wallet.id,
            reservationId,
            type: 'DEBIT_PENALITE',
            montant: montantPenalite,
            sens: 'DEBIT',
            soldeApres: nouveauSolde,
            description: `Pénalité annulation: ${motif}`,
          },
        });

        this.logger.log(`Wallet proprio débité: ${montantPenalite} FCFA (nouveau solde: ${nouveauSolde} FCFA)`);
      } else {
        // Sinon: on débite ce qu'on peut + on ajoute une dette
        const nouvelleDette = dette + (montantPenalite - solde);

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            soldeDisponible: 0,
            dettePenalites: nouvelleDette,
          },
        });

        await tx.transactionWallet.create({
          data: {
            walletId: wallet.id,
            reservationId,
            type: 'DEBIT_PENALITE',
            montant: solde,
            sens: 'DEBIT',
            soldeApres: 0,
            description: `Pénalité annulation partielle: ${motif} (dette créée: ${nouvelleDette} FCFA)`,
          },
        });

        this.logger.warn(
          `Solde insuffisant - Dette créée: ${nouvelleDette} FCFA (solde: ${solde}, pénalité: ${montantPenalite})`,
        );
      }
    });
  }
}
