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
  async getOwnerStats(ownerId: string) {
    // 1. Récupérer le solde du Wallet et son ID
    const wallet = await this.prisma.wallet.findUnique({
      where: { utilisateurId: ownerId },
      select: { id: true, soldeDisponible: true },
    });

    // 2. Calculer les revenus totaux (Réservations payées ou terminées)
    const earnings = await this.prisma.reservation.aggregate({
      where: { 
        proprietaireId: ownerId,
        statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] }
      },
      _sum: { netProprietaire: true },
      _count: { id: true },
    });

    // 2b. Calculer le montant en séquestre (pending) : PAID, CONFIRMED, CHECKED_IN
    const pendingReservations = await this.prisma.reservation.aggregate({
      where: {
        proprietaireId: ownerId,
        statut: { in: [StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN] }
      },
      _sum: { netProprietaire: true }
    });
    const pendingAmount = Number(pendingReservations._sum.netProprietaire || 0);

    // 2c. Calculer les retraits en cours (processing) : statut EN_ATTENTE
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

    // 3. Calcul du taux de conversion (Acceptation)
    const allBookings = await this.prisma.reservation.groupBy({
      by: ['statut'],
      where: { proprietaireId: ownerId },
      _count: true,
    });

    const totalProcessed = allBookings
      .filter(b => b.statut !== StatutReservation.PENDING)
      .reduce((acc, curr) => acc + curr._count, 0);

    const totalSuccessful = allBookings
      .filter(b => ([StatutReservation.PAID, StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] as StatutReservation[]).includes(b.statut))
      .reduce((acc, curr) => acc + curr._count, 0);

    const conversionRate = totalProcessed > 0 ? Math.round((totalSuccessful / totalProcessed) * 100) : 0;

    // 4. Compter les logements par statut
    const listingsCount = await this.prisma.logement.groupBy({
      by: ['statut'],
      where: { proprietaireId: ownerId },
      _count: true,
    });

    // 5. Note moyenne du propriétaire
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: ownerId },
      select: { noteProprietaire: true, totalAvis: true },
    });

    return {
      wallet: {
        balance: Number(wallet?.soldeDisponible || 0),
        pending: pendingAmount,
        processing: processingWithdrawals,
      },
      bookings: {
        total: earnings._count.id || 0,
        revenue: Number(earnings._sum.netProprietaire || 0),
        conversionRate, // Nouveau : Taux d'acceptation en %
      },
      reputation: {
        rating: Number(user?.noteProprietaire || 0),
        totalReviews: user?.totalAvis || 0,
      },
      listings: {
        active: listingsCount.find(l => l.statut === StatutLogement.PUBLISHED)?._count || 0,
        drafts: listingsCount.find(l => l.statut === StatutLogement.DRAFT)?._count || 0,
        pending: listingsCount.find(l => l.statut === StatutLogement.PENDING_REVIEW)?._count || 0,
      }
    };
  }

  /**
   * Actions en attente (Réservations à confirmer, etc.)
   */
  async getPendingActions(ownerId: string) {
    const pendingConfirmations = await this.prisma.reservation.count({
      where: { 
        proprietaireId: ownerId,
        statut: StatutReservation.PAID
      }
    });

    const activeDisputes = await this.prisma.litige.count({
      where: { 
        reservation: { proprietaireId: ownerId },
        statut: 'EN_ATTENTE'
      }
    });

    const pendingCheckins = await this.prisma.reservation.findMany({
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
    });

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

    const checkins = await this.prisma.reservation.findMany({
      where: {
        proprietaireId: ownerId,
        statut: StatutReservation.CONFIRMED,
        dateDebut: { gte: now, lte: in48Hours }
      },
      include: { locataire: { select: { prenom: true, nom: true } }, logement: { select: { titre: true } } }
    });

    const checkouts = await this.prisma.reservation.findMany({
      where: {
        proprietaireId: ownerId,
        statut: StatutReservation.CHECKED_IN,
        dateFin: { gte: now, lte: in48Hours }
      },
      include: { locataire: { select: { prenom: true, nom: true } }, logement: { select: { titre: true } } }
    });

    return { checkins, checkouts };
  }
}
