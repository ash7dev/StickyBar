import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreditWalletUseCase } from '../../domain/wallet/use-cases/credit-wallet.use-case';
import { RequestWithdrawalUseCase } from '../../domain/wallet/use-cases/request-withdrawal.use-case';
import { ProcessWithdrawalUseCase, ProcessWithdrawalInput } from '../../domain/wallet/use-cases/process-withdrawal.use-case';
import { RequestWithdrawalDto } from './dto/withdrawal.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditUseCase: CreditWalletUseCase,
    private readonly requestWithdrawalUseCase: RequestWithdrawalUseCase,
    private readonly processWithdrawalUseCase: ProcessWithdrawalUseCase,
  ) {}

  async getMyWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { utilisateurId: userId },
      select: {
        id: true,
        soldeDisponible: true,
        dettePenalites: true,
        misAJourLe: true,
        transactions: {
          orderBy: { creeLe: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            montant: true,
            sens: true,
            soldeApres: true,
            description: true,
            reservationId: true,
            creeLe: true,
          },
        },
      },
    });

    // Wallet non encore créé (propriétaire sans réservation)
    if (!wallet) {
      return { soldeDisponible: 0, dettePenalites: 0, transactions: [] };
    }

    const reservationIds = wallet.transactions
      .map((t) => t.reservationId)
      .filter((id): id is string => Boolean(id));

    const reservationsMap = new Map<
      string,
      { typePaiement: string; montantAcompte: number; netProprietaire: number; montantSoldeRestant: number }
    >();

    if (reservationIds.length > 0) {
      const reservations = await this.prisma.reservation.findMany({
        where: { id: { in: reservationIds } },
        select: {
          id: true,
          typePaiement: true,
          montantAcompte: true,
          netProprietaire: true,
          montantSoldeRestant: true,
        },
      });

      for (const r of reservations) {
        reservationsMap.set(r.id, {
          typePaiement: r.typePaiement,
          montantAcompte: Number(r.montantAcompte || 0),
          netProprietaire: Number(r.netProprietaire || 0),
          montantSoldeRestant: Number(r.montantSoldeRestant || 0),
        });
      }
    }

    const transactionsEnriched = wallet.transactions.map((t) => ({
      ...t,
      reservation: t.reservationId ? reservationsMap.get(t.reservationId) ?? null : null,
    }));

    return {
      ...wallet,
      transactions: transactionsEnriched,
    };
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    return this.requestWithdrawalUseCase.execute(userId, dto);
  }

  async processWithdrawal(retraitId: string, adminId: string, input: ProcessWithdrawalInput) {
    return this.processWithdrawalUseCase.execute(retraitId, adminId, input);
  }

  async getPendingWithdrawals() {
    return this.prisma.retrait.findMany({
      where: { statut: 'EN_ATTENTE' },
      orderBy: { demandeeLe: 'asc' },
      include: {
        wallet: {
          select: {
            utilisateurId: true,
            utilisateur: {
              select: { id: true, nom: true, prenom: true, telephone: true },
            },
          },
        },
      },
    });
  }

  async getWithdrawalsHistoryForAdmin(statut?: any) {
    return this.prisma.retrait.findMany({
      where: statut ? { statut } : {},
      orderBy: { demandeeLe: 'desc' },
      include: {
        wallet: {
          select: {
            utilisateurId: true,
            utilisateur: {
              select: { id: true, nom: true, prenom: true, telephone: true, email: true },
            },
          },
        },
      },
    });
  }
}
