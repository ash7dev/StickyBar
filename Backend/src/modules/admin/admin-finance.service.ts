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

  async getFinancialStats(dto: { startDate?: string; endDate?: string; ville?: string; type?: string }) {
    let startD: Date | undefined = dto.startDate ? new Date(dto.startDate) : undefined;
    let endD: Date | undefined = dto.endDate ? new Date(dto.endDate) : undefined;

    if (startD && isNaN(startD.getTime())) startD = undefined;
    if (endD && isNaN(endD.getTime())) endD = undefined;

    if (startD) startD.setHours(0, 0, 0, 0);
    if (endD) endD.setHours(23, 59, 59, 999);

    const whereRes: Prisma.ReservationWhereInput = {
      statut: {
        in: ['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'PENDING'],
      },
      ...(startD || endD
        ? {
            creeLe: {
              ...(startD && { gte: startD }),
              ...(endD && { lte: endD }),
            },
          }
        : {}),
      ...((dto.ville || dto.type) && {
        logement: {
          ...(dto.ville && { ville: { contains: dto.ville, mode: 'insensitive' } }),
          ...(dto.type && { type: dto.type as any }),
        },
      }),
    };

    const [aggregateRes, penaltyTx, reservationsList] = await Promise.all([
      this.prisma.reservation.aggregate({
        where: whereRes,
        _sum: {
          totalLocataire: true,
          montantCommission: true,
          netProprietaire: true,
        },
        _count: { id: true },
      }),
      this.prisma.transactionWallet.aggregate({
        where: {
          type: 'DEBIT_PENALITE',
          ...(startD || endD
            ? {
                creeLe: {
                  ...(startD && { gte: startD }),
                  ...(endD && { lte: endD }),
                },
              }
            : {}),
        },
        _sum: { montant: true },
        _count: { id: true },
      }),
      this.prisma.reservation.findMany({
        where: whereRes,
        select: {
          id: true,
          statut: true,
          totalLocataire: true,
          montantCommission: true,
          netProprietaire: true,
          creeLe: true,
          locataire: { select: { prenom: true, nom: true } },
          logement: { select: { id: true, titre: true, ville: true, type: true } },
        },
        orderBy: { creeLe: 'desc' },
        take: 100,
      }),
    ]);

    const totalGmv = Number(aggregateRes._sum.totalLocataire ?? 0);
    const commissionsTotal = Number(aggregateRes._sum.montantCommission ?? 0);
    const hostPayoutsTotal = Number(aggregateRes._sum.netProprietaire ?? 0);
    const penaltiesTotal = Number(penaltyTx._sum.montant ?? 0);
    const netKlefRevenue = commissionsTotal + penaltiesTotal;

    // Generer un dictionnaire de dates pour garantir un axe chronologique non vide
    const timeMap: Record<string, { date: string; gmv: number; commissions: number; penalties: number; netKlef: number; count: number }> = {};

    const rangeEnd = endD || new Date();
    const rangeStart = startD || new Date(new Date().setDate(rangeEnd.getDate() - 14));

    const curr = new Date(rangeStart);
    while (curr <= rangeEnd) {
      const dStr = curr.toISOString().slice(0, 10);
      timeMap[dStr] = { date: dStr, gmv: 0, commissions: 0, penalties: 0, netKlef: 0, count: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    for (const r of reservationsList) {
      const dateKey = r.creeLe.toISOString().slice(0, 10);
      if (!timeMap[dateKey]) {
        timeMap[dateKey] = { date: dateKey, gmv: 0, commissions: 0, penalties: 0, netKlef: 0, count: 0 };
      }
      const comm = Number(r.montantCommission ?? 0);
      const gmv = Number(r.totalLocataire ?? 0);
      timeMap[dateKey].gmv += gmv;
      timeMap[dateKey].commissions += comm;
      timeMap[dateKey].netKlef += comm;
      timeMap[dateKey].count += 1;
    }

    // Breakdown par Ville enrichi avec le nombre de logements actifs
    const cityListings = await this.prisma.logement.groupBy({
      by: ['ville'],
      where: { archiveLe: null },
      _count: { id: true },
    });

    const cityMap: Record<string, { ville: string; gmv: number; commissions: number; count: number; logementsCount: number; sharePct: number }> = {};

    // Pré-remplir les principales villes avec leur nombre de biens
    for (const cl of cityListings) {
      const v = cl.ville?.trim() || 'Dakar';
      if (!cityMap[v]) {
        cityMap[v] = { ville: v, gmv: 0, commissions: 0, count: 0, logementsCount: cl._count.id, sharePct: 0 };
      }
    }

    for (const r of reservationsList) {
      const v = r.logement?.ville?.trim() || 'Dakar';
      if (!cityMap[v]) cityMap[v] = { ville: v, gmv: 0, commissions: 0, count: 0, logementsCount: 1, sharePct: 0 };
      cityMap[v].gmv += Number(r.totalLocataire ?? 0);
      cityMap[v].commissions += Number(r.montantCommission ?? 0);
      cityMap[v].count += 1;
    }

    const totalComms = commissionsTotal > 0 ? commissionsTotal : 1;
    const sortedCities = Object.values(cityMap)
      .map((c) => ({
        ...c,
        sharePct: Math.round((c.commissions / totalComms) * 100),
      }))
      .sort((a, b) => b.commissions - a.commissions || b.logementsCount - a.logementsCount);

    // Breakdown par Type
    const typeMap: Record<string, { type: string; gmv: number; commissions: number; count: number }> = {};
    for (const r of reservationsList) {
      const t = r.logement?.type || 'APPARTEMENT';
      if (!typeMap[t]) typeMap[t] = { type: t, gmv: 0, commissions: 0, count: 0 };
      typeMap[t].gmv += Number(r.totalLocataire ?? 0);
      typeMap[t].commissions += Number(r.montantCommission ?? 0);
      typeMap[t].count += 1;
    }

    return {
      summary: {
        netKlefRevenue,
        commissionsTotal,
        penaltiesTotal,
        totalGmv,
        hostPayoutsTotal,
        reservationCount: aggregateRes._count.id,
      },
      timeSeries: Object.values(timeMap).sort((a, b) => a.date.localeCompare(b.date)),
      breakdownByCity: sortedCities,
      breakdownByType: Object.values(typeMap).sort((a, b) => b.commissions - a.commissions),
      recentKlefLedger: reservationsList.map((r) => ({
        id: r.id,
        date: r.creeLe,
        title: r.logement?.titre,
        ville: r.logement?.ville,
        locataire: `${r.locataire?.prenom ?? ''} ${r.locataire?.nom ?? ''}`.trim(),
        totalBrut: Number(r.totalLocataire),
        partHote: Number(r.netProprietaire),
        partKlef: Number(r.montantCommission),
        typeGain: 'COMMISSION_RESERVATION',
      })),
    };
  }
}
