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

      // Calcul du solde gelé à titre conservatoire pour les litiges en cours
      const litigesEnAttente = await tx.litige.findMany({
        where: {
          statut: 'EN_ATTENTE',
          reservation: { proprietaireId: userId },
        },
        include: {
          reservation: {
            select: {
              netProprietaire: true,
              typePaiement: true,
              montantAcompte: true,
              montantCommission: true,
            },
          },
        },
      });

      let soldeGeleLitige = 0;
      for (const litige of litigesEnAttente) {
        const r = litige.reservation;
        const isDeposit = r.typePaiement?.toUpperCase() === 'DEPOSIT';
        const commNum = Number(r.montantCommission || 0);
        const montantImpacte = isDeposit
          ? Math.max(0, Number(r.montantAcompte || 0) - commNum)
          : Number(r.netProprietaire || 0);

        soldeGeleLitige += montantImpacte;
      }

      const soldeRetirable = Math.max(0, solde - soldeGeleLitige);

      if (montant > soldeRetirable) {
        if (soldeGeleLitige > 0) {
          throw new BadRequestException(
            `Impossible d'effectuer ce retrait de ${montant.toLocaleString('fr-FR')} FCFA. ` +
            `Votre solde disponible est de ${solde.toLocaleString('fr-FR')} FCFA, ` +
            `mais ${soldeGeleLitige.toLocaleString('fr-FR')} FCFA sont gelés en raison de litige(s) en cours d'arbitrage. ` +
            `Solde maximum retirable actuellement : ${soldeRetirable.toLocaleString('fr-FR')} FCFA.`
          );
        }
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
