import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';
import { AdminFinanceQueryDto, AdminRefundsQueryDto, AdminWebhooksQueryDto } from './dto/admin-finance-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refundPayment: RefundPaymentUseCase,
  ) {}

  async listTransactions(dto: AdminFinanceQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.TransactionWalletWhereInput = {
      ...(dto.search && {
        OR: [
          { walletId: { contains: dto.search, mode: 'insensitive' } },
          { reservationId: { contains: dto.search, mode: 'insensitive' } },
          { description: { contains: dto.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, transactions] = await Promise.all([
      this.prisma.transactionWallet.count({ where }),
      this.prisma.transactionWallet.findMany({
        where,
        include: {
          wallet: {
            select: {
              utilisateur: {
                select: { id: true, prenom: true, nom: true, email: true, telephone: true },
              },
            },
          },
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listRefunds(dto: AdminRefundsQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.RefundWhereInput = {
      ...(dto.statut && { statut: dto.statut }),
    };

    const [total, refunds] = await Promise.all([
      this.prisma.refund.count({ where }),
      this.prisma.refund.findMany({
        where,
        include: {
          reservation: {
            select: {
              id: true,
              totalLocataire: true,
              locataire: { select: { prenom: true, nom: true, telephone: true } },
              proprietaire: { select: { prenom: true, nom: true, telephone: true } },
            },
          },
          paiement: {
            select: { fournisseur: true, idTransactionFournisseur: true },
          },
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: refunds,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async retryRefund(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { reservation: true },
    });

    if (!refund) throw new NotFoundException(`Remboursement ${refundId} introuvable`);

    const result = await this.refundPayment.execute(refund.reservationId);
    return {
      success: true,
      refundId: refund.id,
      result,
      message: 'Relance de remboursement exécutée',
    };
  }

  async listWebhookLogs(dto: AdminWebhooksQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.WebhookLogWhereInput = {
      ...(dto.provider && { provider: dto.provider }),
      ...(dto.isValid !== undefined && { isValid: dto.isValid }),
    };

    const [total, logs] = await Promise.all([
      this.prisma.webhookLog.count({ where }),
      this.prisma.webhookLog.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustWalletBalance(dto: { utilisateurId: string; montant: number; sens: 'CREDIT' | 'DEBIT'; description: string }) {
    const user = await this.prisma.utilisateur.findUnique({ where: { id: dto.utilisateurId } });
    if (!user) throw new NotFoundException(`Utilisateur ${dto.utilisateurId} introuvable`);

    const wallet = await this.prisma.wallet.upsert({
      where: { utilisateurId: dto.utilisateurId },
      create: { utilisateurId: dto.utilisateurId, soldeDisponible: 0 },
      update: {},
    });

    const isCredit = dto.sens === 'CREDIT';
    const amountChange = isCredit ? dto.montant : -dto.montant;

    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        soldeDisponible: { increment: amountChange },
      },
    });

    const transaction = await this.prisma.transactionWallet.create({
      data: {
        walletId: wallet.id,
        type: isCredit ? 'REMBOURSEMENT' : 'DEBIT_PENALITE',
        montant: dto.montant,
        sens: dto.sens,
        soldeApres: updatedWallet.soldeDisponible,
        description: `[AJUSTEMENT ADMIN] ${dto.description}`,
      },
    });

    return {
      success: true,
      walletId: wallet.id,
      nouveauSolde: updatedWallet.soldeDisponible,
      transactionId: transaction.id,
      message: `Portefeuille ${dto.sens === 'CREDIT' ? 'crédité' : 'débité'} avec succès`,
    };
  }
}
