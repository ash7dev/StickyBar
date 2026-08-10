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
  async getOwnerStats(ownerId: string) {
    const now = new Date();
    const monthsBack = 6;
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

    // Exécuter toutes les requêtes indépendantes en parallèle via Promise.all
    const [wallet, earnings, pendingDeposit, pendingFull, allBookings, listingsCount, user, monthlyRaw] = await Promise.all([
      // 1. Solde du Wallet
      this.prisma.wallet.findUnique({
        where: { utilisateurId: ownerId },
        select: { id: true, soldeDisponible: true },
      }),
      // 2. Revenus totaux
      this.prisma.reservation.aggregate({
        where: { 
          proprietaireId: ownerId,
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] }
        },
        _sum: { netProprietaire: true },
        _count: { id: true },
      }),
      // 2b. Montant en séquestre pour réservations DEPOSIT (acomptes payés en ligne AVANT check-in)
      this.prisma.reservation.aggregate({
        where: {
          proprietaireId: ownerId,
          typePaiement: 'DEPOSIT',
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED] }
        },
        _sum: { montantAcompte: true }
      }),
      // 2c. Montant en séquestre pour réservations FULL (100% payé en ligne AVANT check-in)
      this.prisma.reservation.aggregate({
        where: {
          proprietaireId: ownerId,
          typePaiement: 'FULL',
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED] }
        },
        _sum: { netProprietaire: true }
      }),
      // 3. Taux de conversion
      this.prisma.reservation.groupBy({
        by: ['statut'],
        where: { proprietaireId: ownerId },
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
      // 6. Historique des réservations des 6 derniers mois pour la courbe de revenus
      this.prisma.reservation.findMany({
        where: {
          proprietaireId: ownerId,
          statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] },
          dateDebut: { gte: startDate },
        },
        select: {
          dateDebut: true,
          netProprietaire: true,
        },
      }),
    ]);

    const pendingAmount = Number(pendingDeposit._sum.montantAcompte || 0) + Number(pendingFull._sum.netProprietaire || 0);

    // Retraits en cours s'il existe un wallet
    let processingWithdrawals = 0;
    if (wallet) {
      const withdrawalsSum = await this.prisma.retrait.aggregate({
        where: {
          walletId: wallet.id,
          statut: 'EN_ATTENTE',
        },
        _sum: { montant: true },
      });
      processingWithdrawals = Number(withdrawalsSum._sum.montant || 0);
    }

    const totalProcessed = allBookings
      .filter(b => b.statut !== StatutReservation.PENDING)
      .reduce((acc, curr) => acc + curr._count, 0);

    const totalSuccessful = allBookings
      .filter(b => ([StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] as StatutReservation[]).includes(b.statut))
      .reduce((acc, curr) => acc + curr._count, 0);

    const conversionRate = totalProcessed > 0 ? Math.round((totalSuccessful / totalProcessed) * 100) : 0;

    // Calculer les points mensuels réels pour le graphique hôte
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const monthlyRevenue: { label: string; value: number; isCurrent: boolean }[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = monthNames[d.getMonth()];
      const value = monthlyRaw
        .filter(r => {
          const rd = new Date(r.dateDebut);
          return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
        })
        .reduce((sum, r) => sum + Number(r.netProprietaire || 0), 0);

      monthlyRevenue.push({ label, value, isCurrent: i === 0 });
    }

    return {
      wallet: {
        balance: Number(wallet?.soldeDisponible || 0),
        pending: pendingAmount,
        processing: processingWithdrawals,
      },
      bookings: {
        total: earnings._count.id || 0,
        revenue: Number(earnings._sum.netProprietaire || 0),
        conversionRate,
      },
      reputation: {
        rating: Number(user?.noteProprietaire || 0),
        totalReviews: user?.totalAvis || 0,
      },
      listings: {
        active: listingsCount.find(l => l.statut === StatutLogement.PUBLISHED)?._count || 0,
        drafts: listingsCount.find(l => l.statut === StatutLogement.DRAFT)?._count || 0,
        pending: listingsCount.find(l => l.statut === StatutLogement.PENDING_REVIEW)?._count || 0,
      },
      monthlyRevenue,
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
