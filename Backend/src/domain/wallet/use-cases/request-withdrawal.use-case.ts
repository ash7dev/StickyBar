import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MethodeRetrait, SensTransaction, StatutRetrait, TypeTransactionWallet } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const MONTANT_MIN_FCFA = 10_000;

export interface RequestWithdrawalInput {
  montant: number;
  methode: MethodeRetrait;
  destinataire: string;
}

@Injectable()
export class RequestWithdrawalUseCase {
  private readonly logger = new Logger(RequestWithdrawalUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, input: RequestWithdrawalInput) {
    const { montant, methode, destinataire } = input;

    if (montant < MONTANT_MIN_FCFA) {
      throw new BadRequestException(
        `Montant minimum de retrait : ${MONTANT_MIN_FCFA.toLocaleString('fr-FR')} FCFA`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { utilisateurId: userId },
        select: { id: true, soldeDisponible: true, dettePenalites: true },
      });

      if (!wallet) throw new NotFoundException('Wallet introuvable');

      const solde = Number(wallet.soldeDisponible);
      const dette = Number(wallet.dettePenalites);

      // Bloquer les retraits si une dette existe
      if (dette > 0) {
        throw new BadRequestException(
          `Vous avez une dette de pénalités de ${dette.toLocaleString('fr-FR')} FCFA. ` +
          `Les retraits sont bloqués jusqu'au remboursement complet de cette dette. ` +
          `La dette sera automatiquement déduite de vos prochains revenus de location.`
        );
      }

      if (solde < montant) {
        throw new BadRequestException(
          `Solde insuffisant. Disponible : ${solde.toLocaleString('fr-FR')} FCFA`,
        );
      }

      const soldeApres = solde - montant;

      const retrait = await tx.retrait.create({
        data: {
          walletId: wallet.id,
          montant,
          methode,
          destinataire,
          statut: StatutRetrait.EN_ATTENTE,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { soldeDisponible: { decrement: montant } },
      });

      await tx.transactionWallet.create({
        data: {
          walletId: wallet.id,
          type: TypeTransactionWallet.DEBIT_RETRAIT,
          montant,
          sens: SensTransaction.DEBIT,
          soldeApres,
          description: `Demande retrait via ${methode} — ${destinataire}`,
        },
      });

      this.logger.log(
        `Retrait demandé [userId: ${userId}] ${montant.toLocaleString('fr-FR')} FCFA via ${methode}`,
      );

      return retrait;
    }, { isolationLevel: 'Serializable' });
  }
}
