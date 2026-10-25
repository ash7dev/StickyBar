import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';
import { SystemLedgerService } from '../../domain/system-ledger/system-ledger.service';
import { AdminFinanceQueryDto, AdminRefundsQueryDto, AdminWebhooksQueryDto } from './dto/admin-finance-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refundPayment: RefundPaymentUseCase,
    private readonly systemLedger: SystemLedgerService,
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
    if (refund.statut === 'EXECUTE') {
      throw new BadRequestException('Ce remboursement a déjà été versé : rien à relancer.');
    }

    // Relance du même montant que celui prévu, jamais un remboursement intégral par défaut
    const result = await this.refundPayment.execute(refund.reservationId, {
      montant: Number(refund.montantTotal),
      motif: refund.motif,
      declenchePar: refund.declenchePar ?? 'ADMIN_RETRY',
    });
    await this.prisma.refund.update({ where: { id: refund.id }, data: { statut: 'ANNULE', echecRaison: `Relancé : ${result.refundId ?? 'rien à rembourser'}` } });
    return {
      success: true,
      refundId: result.refundId,
      result: { argent: result.cash, coins: result.coins },
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

  /**
   * Ajustement manuel d'un portefeuille : atomique, jamais en dessous de zéro,
   * et chaque mouvement garde l'identité de l'administrateur qui l'a fait.
   */
  async adjustWalletBalance(
    adminId: string,
    dto: { utilisateurId: string; montant: number; sens: 'CREDIT' | 'DEBIT'; description: string },
  ) {
    const montant = Math.round(Number(dto.montant));
    if (!(montant > 0)) throw new BadRequestException('Le montant doit être positif');
    if (!dto.description?.trim()) throw new BadRequestException('Indiquez la raison de l’ajustement');

    const user = await this.prisma.utilisateur.findUnique({ where: { id: dto.utilisateurId }, select: { id: true } });
    if (!user) throw new NotFoundException(`Utilisateur ${dto.utilisateurId} introuvable`);

    return this.prisma.$transaction(async (tx) => {
      const [w] = await tx.$queryRaw<Array<{ id: string; soldeDisponible: Prisma.Decimal }>>`
        SELECT id, "soldeDisponible" FROM "Wallet" WHERE "utilisateurId" = ${dto.utilisateurId} FOR UPDATE
      `;
      const wallet = w ?? (await tx.wallet.create({ data: { utilisateurId: dto.utilisateurId, soldeDisponible: 0 } }));
      const solde = Number(wallet.soldeDisponible);
      const isCredit = dto.sens === 'CREDIT';
      if (!isCredit && montant > solde) {
        throw new BadRequestException(`Solde insuffisant : ${solde.toLocaleString('fr-FR')} FCFA disponibles`);
      }
      const nouveauSolde = isCredit ? solde + montant : solde - montant;

      await tx.wallet.update({ where: { id: wallet.id }, data: { soldeDisponible: nouveauSolde } });
      const transaction = await tx.transactionWallet.create({
        data: {
          walletId: wallet.id,
          type: isCredit ? 'REMBOURSEMENT' : 'DEBIT_PENALITE',
          montant,
          sens: dto.sens,
          soldeApres: nouveauSolde,
          description: `[AJUSTEMENT ADMIN ${adminId}] ${dto.description.trim()}`,
        },
      });

      return {
        success: true,
        walletId: wallet.id,
        nouveauSolde,
        transactionId: transaction.id,
        message: `Portefeuille ${isCredit ? 'crédité' : 'débité'} avec succès`,
      };
    }, { isolationLevel: 'Serializable' });
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

    const systemLedgerSummary = await this.systemLedger.getLedgerSummary();

    return {
      summary: {
        netKlefRevenue,
        commissionsTotal,
        penaltiesTotal,
        totalGmv,
        hostPayoutsTotal,
        reservationCount: aggregateRes._count.id,
      },
      systemLedger: systemLedgerSummary,
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
