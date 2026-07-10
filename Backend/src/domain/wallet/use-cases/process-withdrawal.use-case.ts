import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StatutRetrait, SensTransaction, TypeTransactionWallet } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export type ProcessAction = 'validate' | 'reject';

export interface ProcessWithdrawalInput {
  action: ProcessAction;
  raisonRejet?: string;
  transactionId?: string; // ID de transaction externe (Wave, Orange Money, etc.)
}

@Injectable()
export class ProcessWithdrawalUseCase {
  private readonly logger = new Logger(ProcessWithdrawalUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(retraitId: string, adminId: string, input: ProcessWithdrawalInput) {
    return this.prisma.$transaction(async (tx) => {
      const retrait = await tx.retrait.findUnique({
        where: { id: retraitId },
        include: { wallet: { select: { id: true, soldeDisponible: true } } },
      });

      if (!retrait) throw new NotFoundException('Retrait introuvable');

      if (retrait.statut !== StatutRetrait.EN_ATTENTE) {
        throw new BadRequestException(
          `Ce retrait est déjà traité (statut : ${retrait.statut})`,
        );
      }

      const now = new Date();

      if (input.action === 'validate') {
        const montant = Number(retrait.montant);
        const soldeInitial = Number(retrait.wallet.soldeDisponible);

        const updated = await tx.retrait.update({
          where: { id: retraitId },
          data: {
            statut: StatutRetrait.VALIDE,
            traiteLe: now,
            transactionIdExterne: input.transactionId,
          },
        });

        // Créer une transaction wallet pour traçabilité complète
        await tx.transactionWallet.create({
          data: {
            walletId: retrait.walletId,
            type: TypeTransactionWallet.DEBIT_RETRAIT,
            montant,
            sens: SensTransaction.DEBIT,
            soldeApres: soldeInitial, // Le solde a déjà été débité lors de la demande
            description: `Retrait validé par admin ${adminId} via ${retrait.methode} — ${retrait.destinataire}` +
              (input.transactionId ? ` (TX: ${input.transactionId})` : ''),
          },
        });

        this.logger.log(
          `Retrait validé [${retraitId}] par admin ${adminId} — ` +
          `${montant.toLocaleString('fr-FR')} FCFA vers ${retrait.destinataire}` +
          (input.transactionId ? ` (TX: ${input.transactionId})` : '')
        );

        // TODO: Déclencher le transfert réel via API Wave/Orange Money/Virement
        this.logger.warn(
          `[TODO] Transfert financier externe à effectuer : ${montant} FCFA ` +
          `via ${retrait.methode} vers ${retrait.destinataire}`
        );

        return updated;
      }

      // Rejet : raison obligatoire + remboursement du solde
      if (!input.raisonRejet?.trim()) {
        throw new BadRequestException('Une raison de rejet est obligatoire');
      }

      const montant = Number(retrait.montant);
      const soldeInitial = Number(retrait.wallet.soldeDisponible);
      const soldeApres = soldeInitial + montant;

      // Recréditer le wallet
      await tx.wallet.update({
        where: { id: retrait.walletId },
        data: { soldeDisponible: { increment: montant } },
      });

      // Créer une transaction pour le remboursement
      await tx.transactionWallet.create({
        data: {
          walletId: retrait.walletId,
          type: TypeTransactionWallet.CREDIT_LOCATION, // Remboursement = crédit
          montant,
          sens: SensTransaction.CREDIT,
          soldeApres,
          description: `Remboursement suite au rejet de retrait — Raison: ${input.raisonRejet}`,
        },
      });

      const updated = await tx.retrait.update({
        where: { id: retraitId },
        data: {
          statut: StatutRetrait.REJETE,
          raisonRejet: input.raisonRejet,
          traiteLe: now,
        },
      });

      this.logger.log(
        `Retrait rejeté [${retraitId}] par admin ${adminId} — ${input.raisonRejet}. ` +
        `Montant de ${montant.toLocaleString('fr-FR')} FCFA recrédité au wallet.`
      );

      return updated;
    }, { isolationLevel: 'Serializable' });
  }
}
