import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StatutReservation, StatutLogement } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Statistiques globales pour le propriétaire
   */
  /**
   * Statistiques globales pour le propriétaire
   */
  async getOwnerStats(ownerId: string, timeframe?: string) {
    const now = new Date();
    let monthsBack = 6;
    let startDate: Date | undefined = undefined;

    if (timeframe) {
      const tf = timeframe.toLowerCase().trim();
      if (tf.includes('ce mois') || tf === '1m') {
        monthsBack = 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (tf.includes('30') || tf === '30d') {
        monthsBack = 2;
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
      } else if (tf.includes('6') || tf === '6m') {
        monthsBack = 6;
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      } else if (tf.includes('an') || tf.includes('année') || tf === '1y') {
        monthsBack = now.getMonth() + 1;
        startDate = new Date(now.getFullYear(), 0, 1);
      }
    }

    const chartStartDate = startDate || new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

    // Exécuter toutes les requêtes indépendantes en parallèle via Promise.all
    const [
      wallet,
      earnings,
      nightsAgg,
      pendingDeposit,
      pendingFull,
      allBookings,
      listingsCount,
      user,
      monthlyRaw,
      topListingsRaw
    ] = await Promise.all([
      // 1. Solde du Wallet
      this.prisma.wallet.findUnique({
        where: { utilisateurId: ownerId },
        select: { id: true, soldeDisponible: true },
      }),
      // 2. Revenus totaux
      this.prisma.reservation.aggregate({
        where: { 
          proprietaireId: ownerId,
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] },
          ...(startDate ? { dateDebut: { gte: startDate } } : {}),
        },
        _sum: { netProprietaire: true },
        _count: { id: true },
      }),
      // 2b. Cumul des nuits pour les réservations réussies
      this.prisma.reservation.aggregate({
        where: {
          proprietaireId: ownerId,
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] },
          ...(startDate ? { dateDebut: { gte: startDate } } : {}),
        },
        _sum: { nbNuits: true },
      }),
      // 2c. Montant net en séquestre pour l'hôte sur les réservations DEPOSIT (acompte en ligne moins commission Klef)
      this.prisma.reservation.findMany({
        where: {
          proprietaireId: ownerId,
          typePaiement: 'DEPOSIT',
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED] },
          ...(startDate ? { dateDebut: { gte: startDate } } : {}),
        },
        select: { montantAcompte: true, montantCommission: true }
      }),
      // 2d. Montant en séquestre pour réservations FULL (100% payé en ligne AVANT check-in)
      this.prisma.reservation.aggregate({
        where: {
          proprietaireId: ownerId,
          typePaiement: 'FULL',
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED] },
          ...(startDate ? { dateDebut: { gte: startDate } } : {}),
        },
        _sum: { netProprietaire: true }
      }),
      // 3. Répartition des réservations par statut (breakdown & conversion)
      this.prisma.reservation.groupBy({
        by: ['statut'],
        where: { 
          proprietaireId: ownerId,
          ...(startDate ? { dateDebut: { gte: startDate } } : {}),
        },
        _count: true,
      }),
      // 4. Compte des logements par statut
      this.prisma.logement.groupBy({
        by: ['statut'],
        where: { proprietaireId: ownerId },
        _count: true,
      }),
      // 5. Note moyenne du propriétaire
      this.prisma.utilisateur.findUnique({
        where: { id: ownerId },
        select: { noteProprietaire: true, totalAvis: true },
      }),
      // 6. Historique des réservations pour la courbe de revenus
      this.prisma.reservation.findMany({
        where: {
          proprietaireId: ownerId,
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] },
          dateDebut: { gte: chartStartDate },
        },
        select: {
          dateDebut: true,
          netProprietaire: true,
        },
      }),
      // 7. Top logements les plus rentables
      this.prisma.reservation.groupBy({
        by: ['logementId'],
        where: {
          proprietaireId: ownerId,
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] },
          ...(startDate ? { dateDebut: { gte: startDate } } : {}),
        },
        _sum: { netProprietaire: true },
        _count: { id: true },
        orderBy: { _sum: { netProprietaire: 'desc' } },
        take: 5,
      }),
    ]);

    const netDepositAmount = (pendingDeposit as any[]).reduce(
      (sum, r) => sum + Math.max(0, Number(r.montantAcompte || 0) - Number(r.montantCommission || 0)),
      0,
    );
    const pendingAmount = netDepositAmount + Number(pendingFull._sum.netProprietaire || 0);

    // Retraits en cours et calcul du solde retirable propre à l'activité hôte
    let processingWithdrawals = 0;
    let hostBalance = 0;

    if (wallet) {
      const [withdrawalsSum, hostCredits, hostDebits] = await Promise.all([
        this.prisma.retrait.aggregate({
          where: {
            walletId: wallet.id,
            statut: 'EN_ATTENTE',
          },
          _sum: { montant: true },
        }),
        this.prisma.transactionWallet.aggregate({
          where: {
            walletId: wallet.id,
            type: 'CREDIT_LOCATION',
            sens: 'CREDIT',
          },
          _sum: { montant: true },
        }),
        this.prisma.transactionWallet.aggregate({
          where: {
            walletId: wallet.id,
            type: { in: ['DEBIT_RETRAIT', 'DEBIT_PENALITE', 'DEBIT_DETTE'] },
            sens: 'DEBIT',
          },
          _sum: { montant: true },
        }),
      ]);

      processingWithdrawals = Number(withdrawalsSum._sum.montant || 0);
      const totalHostCredits = Number(hostCredits._sum.montant || 0);
      const totalHostDebits = Number(hostDebits._sum.montant || 0);

      hostBalance = Math.max(0, totalHostCredits - totalHostDebits);
      hostBalance = Math.min(hostBalance, Number(wallet.soldeDisponible || 0));
    }

    // Calcul de la répartition par statut (Status Breakdown)
    const statusBreakdown: Record<string, number> = {
      COMPLETED: 0,
      CHECKED_IN: 0,
      CONFIRMED: 0,
      PAID: 0,
      PENDING: 0,
      CANCELLED: 0,
      DISPUTED: 0,
      EXPIRED: 0,
    };

    allBookings.forEach((b) => {
      if (b.statut) {
        statusBreakdown[b.statut] = b._count;
      }
    });

    const totalProcessed = allBookings
      .filter(b => b.statut !== StatutReservation.PENDING)
      .reduce((acc, curr) => acc + curr._count, 0);

    const totalSuccessful = allBookings
      .filter(b => ([StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] as StatutReservation[]).includes(b.statut))
      .reduce((acc, curr) => acc + curr._count, 0);

    const conversionRate = totalProcessed > 0 ? Math.round((totalSuccessful / totalProcessed) * 100) : 0;

    const totalNights = Number(nightsAgg._sum.nbNuits || 0);
    const revenue = Number(earnings._sum.netProprietaire || 0);
    const averageDailyRate = totalNights > 0 ? Math.round(revenue / totalNights) : 0;

    const totalAllBookings = Object.values(statusBreakdown).reduce((sum, val) => sum + val, 0);
    const cancellationRate = totalAllBookings > 0 ? Math.round((statusBreakdown.CANCELLED / totalAllBookings) * 100) : 0;

    // Calculer les points mensuels réels pour le graphique hôte
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const monthlyRevenue: Array<{
      label: string;
      month: string;
      value: number;
      revenue: number;
      bookingsCount: number;
      isCurrent: boolean;
    }> = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = monthNames[d.getMonth()];
      const matchingReservations = monthlyRaw.filter(r => {
        const rd = new Date(r.dateDebut);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      });
      const value = matchingReservations.reduce((sum, r) => sum + Number(r.netProprietaire || 0), 0);

      monthlyRevenue.push({
        label,
        month: label,
        value,
        revenue: value,
        bookingsCount: matchingReservations.length,
        isCurrent: i === 0
      });
    }

    // Récupérer détails des logements du Top Performance
    const topLogementIds = (topListingsRaw as any[]).map((t) => t.logementId).filter(Boolean);
    const logementsDetails = topLogementIds.length > 0
      ? await this.prisma.logement.findMany({
          where: { id: { in: topLogementIds } },
          select: { id: true, titre: true, ville: true },
        })
      : [];

    const logementMap = new Map(logementsDetails.map((l) => [l.id, l]));

    const topListings = (topListingsRaw as any[]).map((t) => {
      const log = logementMap.get(t.logementId);
      return {
        id: t.logementId,
        titre: log?.titre || 'Logement',
        ville: log?.ville,
        revenue: Number(t._sum.netProprietaire || 0),
        nights: t._count.id || 0,
      };
    });

    const activeListings = listingsCount.find(l => l.statut === StatutLogement.PUBLISHED)?._count || 0;
    const draftListings = listingsCount.find(l => l.statut === StatutLogement.DRAFT)?._count || 0;
    const pendingListings = listingsCount.find(l => l.statut === StatutLogement.PENDING_REVIEW)?._count || 0;
    const totalListings = activeListings + draftListings + pendingListings;

    const averageRating = Number(user?.noteProprietaire || 0);

    return {
      timeframe: timeframe || '6 mois',
      wallet: {
        balance: hostBalance,
        pending: pendingAmount,
        processing: processingWithdrawals,
      },
      bookings: {
        total: earnings._count.id || 0,
        revenue,
        conversionRate,
        averageRating,
        averageDailyRate,
        totalNights,
        cancellationRate,
      },
      reputation: {
        rating: averageRating,
        totalReviews: user?.totalAvis || 0,
      },
      listings: {
        active: activeListings,
        drafts: draftListings,
        draft: draftListings,
        pending: pendingListings,
        paused: pendingListings,
        total: totalListings,
      },
      statusBreakdown,
      monthlyRevenue,
      topListings,
    };
  }

  /**
   * Actions en attente (Réservations à confirmer, etc.)
   */
  async getPendingActions(ownerId: string) {
    const [pendingConfirmations, activeDisputes, pendingCheckins] = await Promise.all([
      this.prisma.reservation.count({
        where: { 
          proprietaireId: ownerId,
          statut: StatutReservation.PAID
        }
      }),
      this.prisma.litige.count({
        where: { 
          reservation: { proprietaireId: ownerId },
          statut: 'EN_ATTENTE'
        }
      }),
      this.prisma.reservation.findMany({
        where: {
          proprietaireId: ownerId,
          statut: StatutReservation.CONFIRMED,
          checkinProprioLe: null,
        },
        select: {
          id: true,
          dateDebut: true,
          logement: {
            select: { titre: true }
          },
          locataire: {
            select: { prenom: true, nom: true }
          }
        },
        orderBy: { dateDebut: 'asc' }
      })
    ]);

    return {
      pendingConfirmations,
      activeDisputes,
      pendingCheckins,
    };
  }

  /**
   * Activité récente (5 dernières réservations)
   */
  async getRecentActivity(ownerId: string) {
    return this.prisma.reservation.findMany({
      where: { proprietaireId: ownerId },
      take: 5,
      orderBy: { creeLe: 'desc' },
      include: {
        locataire: {
          select: { prenom: true, nom: true, avatarUrl: true }
        },
        logement: {
          select: { titre: true, ville: true, photos: { take: 1, where: { estPrincipale: true } } }
        }
      }
    });
  }

  /**
   * Événements à venir (Check-ins / Check-outs des prochaines 48h)
   */
  async getUpcomingEvents(ownerId: string) {
    const now = new Date();
    const in48Hours = new Date();
    in48Hours.setHours(in48Hours.getHours() + 48);

    const [checkins, checkouts] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          proprietaireId: ownerId,
          statut: StatutReservation.CONFIRMED,
          dateDebut: { gte: now, lte: in48Hours }
        },
        include: { locataire: { select: { prenom: true, nom: true } }, logement: { select: { titre: true } } }
      }),
      this.prisma.reservation.findMany({
        where: {
          proprietaireId: ownerId,
          statut: StatutReservation.CHECKED_IN,
          dateFin: { gte: now, lte: in48Hours }
        },
        include: { locataire: { select: { prenom: true, nom: true } }, logement: { select: { titre: true } } }
      })
    ]);

    return { checkins, checkouts };
  }
}
