import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StatutKyc, StatutLogement, StatutReservation, StatutRetrait, StatutLitige, StatutTicket } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const activeStatuses: StatutReservation[] = [
      StatutReservation.PAID,
      StatutReservation.CONFIRMED,
      StatutReservation.CHECKED_IN,
      StatutReservation.COMPLETED,
    ];

    const [
      aggregateRes,
      totalUsers,
      activeHosts,
      publishedListings,
      completedStays,
    ] = await Promise.all([
      this.prisma.reservation.aggregate({
        where: { statut: { in: activeStatuses } },
        _sum: {
          totalLocataire: true,
          montantCommission: true,
          netProprietaire: true,
        },
        _count: { id: true },
      }),
      this.prisma.utilisateur.count({ where: { actif: true } }),
      this.prisma.utilisateur.count({ where: { actif: true, estProprietaire: true } }),
      this.prisma.logement.count({ where: { statut: StatutLogement.PUBLISHED, archiveLe: null } }),
      this.prisma.reservation.count({ where: { statut: StatutReservation.COMPLETED } }),
    ]);

    const gmv = Number(aggregateRes._sum.totalLocataire ?? 0);
    const commissions = Number(aggregateRes._sum.montantCommission ?? 0);
    const payoutsNet = Number(aggregateRes._sum.netProprietaire ?? 0);

    return {
      gmv,
      commissions,
      payoutsNet,
      totalReservations: aggregateRes._count.id,
      totalUsers,
      activeHosts,
      publishedListings,
      completedStays,
    };
  }

  async getPendingSummary() {
    const [
      pendingKyc,
      pendingListings,
      pendingWithdrawals,
      pendingDisputes,
      urgentTickets,
    ] = await Promise.all([
      this.prisma.utilisateur.count({ where: { statutKyc: StatutKyc.EN_ATTENTE } }),
      this.prisma.logement.count({ where: { statut: StatutLogement.PENDING_REVIEW, archiveLe: null } }),
      this.prisma.retrait.count({ where: { statut: StatutRetrait.EN_ATTENTE } }),
      this.prisma.litige.count({ where: { statut: StatutLitige.EN_ATTENTE } }),
      this.prisma.ticketSupport.count({
        where: {
          statut: { in: [StatutTicket.OUVERT, StatutTicket.EN_COURS] },
          priorite: { in: ['HAUTE', 'URGENTE'] },
        },
      }),
    ]);

    return {
      pendingKyc,
      pendingListings,
      pendingWithdrawals,
      pendingDisputes,
      urgentTickets,
      totalUrgentActions: pendingKyc + pendingListings + pendingWithdrawals + pendingDisputes + urgentTickets,
    };
  }

  async getRevenueChart() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        statut: {
          in: [
            StatutReservation.PAID,
            StatutReservation.CONFIRMED,
            StatutReservation.CHECKED_IN,
            StatutReservation.COMPLETED,
          ],
        },
        creeLe: { gte: sixMonthsAgo },
      },
      select: {
        creeLe: true,
        totalLocataire: true,
        montantCommission: true,
      },
      orderBy: { creeLe: 'asc' },
    });

    const monthlyMap: Record<string, { month: string; volume: number; commission: number; count: number }> = {};

    for (const r of reservations) {
      const dateKey = `${r.creeLe.getFullYear()}-${String(r.creeLe.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[dateKey]) {
        monthlyMap[dateKey] = { month: dateKey, volume: 0, commission: 0, count: 0 };
      }
      monthlyMap[dateKey].volume += Number(r.totalLocataire);
      monthlyMap[dateKey].commission += Number(r.montantCommission);
      monthlyMap[dateKey].count += 1;
    }

    return Object.values(monthlyMap);
  }

  async getRecentActivity() {
    const [recentUsers, recentReservations, recentDisputes, recentTickets] = await Promise.all([
      this.prisma.utilisateur.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
        select: { id: true, prenom: true, nom: true, email: true, estProprietaire: true, statutKyc: true, creeLe: true },
      }),
      this.prisma.reservation.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
        select: {
          id: true,
          statut: true,
          totalLocataire: true,
          creeLe: true,
          locataire: { select: { prenom: true, nom: true } },
          logement: { select: { titre: true } },
        },
      }),
      this.prisma.litige.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
        select: { id: true, statut: true, motif: true, creeLe: true, reservationId: true },
      }),
      this.prisma.ticketSupport.findMany({
        take: 5,
        orderBy: { creeLe: 'desc' },
        select: { id: true, code: true, sujet: true, priorite: true, statut: true, creeLe: true },
      }),
    ]);

    return {
      recentUsers,
      recentReservations,
      recentDisputes,
      recentTickets,
    };
  }

  async getGeographicStats() {
    const list = await this.prisma.logement.findMany({
      where: { archiveLe: null },
      select: { ville: true },
    });

    const counts: Record<string, number> = {};
    for (const item of list) {
      const v = item.ville?.trim() || 'Non spécifié';
      counts[v] = (counts[v] || 0) + 1;
    }

    const total = list.length;
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return sorted.map(([ville, count]) => ({
      ville,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }

  async getTopPerformers() {
    const hosts = await this.prisma.utilisateur.findMany({
      where: { estProprietaire: true, actif: true },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        statutKyc: true,
        _count: {
          select: {
            logements: {
              where: { archiveLe: null },
            },
          },
        },
      },
    });

    return hosts
      .map((h) => ({
        id: h.id,
        nom: `${h.prenom ?? ''} ${h.nom ?? ''}`.trim() || h.email,
        email: h.email,
        statutKyc: h.statutKyc,
        totalLogements: h._count.logements,
      }))
      .sort((a, b) => b.totalLogements - a.totalLogements)
      .slice(0, 5);
  }

  async getPendingWithdrawalsList() {
    const list = await this.prisma.retrait.findMany({
      where: { statut: StatutRetrait.EN_ATTENTE },
      take: 5,
      orderBy: { demandeeLe: 'desc' },
      select: {
        id: true,
        montant: true,
        methode: true,
        destinataire: true,
        demandeeLe: true,
        wallet: {
          select: {
            utilisateur: {
              select: { prenom: true, nom: true, email: true },
            },
          },
        },
      },
    });

    return list.map((w) => ({
      id: w.id,
      montant: Number(w.montant),
      methode: w.methode,
      destinataire: w.destinataire,
      demandeeLe: w.demandeeLe,
      hoteNom: `${w.wallet.utilisateur.prenom ?? ''} ${w.wallet.utilisateur.nom ?? ''}`.trim() || w.wallet.utilisateur.email,
    }));
  }

  async getPendingDisputesList() {
    const list = await this.prisma.litige.findMany({
      where: { statut: StatutLitige.EN_ATTENTE },
      take: 5,
      orderBy: { creeLe: 'desc' },
      select: {
        id: true,
        declarePar: true,
        motif: true,
        description: true,
        coutEstime: true,
        creeLe: true,
        reservation: {
          select: {
            id: true,
            totalLocataire: true,
            logement: { select: { titre: true } },
            locataire: { select: { prenom: true, nom: true } },
          },
        },
      },
    });

    return list.map((d) => ({
      id: d.id,
      reservationId: d.reservation.id,
      declarePar: d.declarePar,
      motif: d.motif,
      description: d.description,
      coutEstime: d.coutEstime ? Number(d.coutEstime) : null,
      creeLe: d.creeLe,
      logementTitre: d.reservation.logement.titre,
      locataireNom: `${d.reservation.locataire.prenom ?? ''} ${d.reservation.locataire.nom ?? ''}`.trim(),
    }));
  }

  async getAuditLogs() {
    const [kycLogs, listingLogs, retraitLogs] = await Promise.all([
      this.prisma.utilisateur.findMany({
        take: 3,
        orderBy: { misAJourLe: 'desc' },
        where: { statutKyc: StatutKyc.VERIFIE },
        select: { id: true, prenom: true, nom: true, email: true, misAJourLe: true },
      }),
      this.prisma.logement.findMany({
        take: 3,
        orderBy: { misAJourLe: 'desc' },
        where: { statut: StatutLogement.PUBLISHED },
        select: { id: true, titre: true, misAJourLe: true },
      }),
      this.prisma.retrait.findMany({
        take: 3,
        orderBy: { demandeeLe: 'desc' },
        where: { statut: StatutRetrait.VALIDE },
        select: { id: true, montant: true, methode: true, demandeeLe: true },
      }),
    ]);

    const events: Array<{ id: string; type: string; details: string; date: Date; status: 'SUCCESS' | 'INFO' }> = [];

    for (const u of kycLogs) {
      if (u.misAJourLe) {
        events.push({
          id: `kyc-${u.id}`,
          type: 'KYC_VALIDE',
          details: `Dossier KYC validé pour ${u.prenom ?? ''} ${u.nom ?? ''} (${u.email})`,
          date: u.misAJourLe,
          status: 'SUCCESS',
        });
      }
    }

    for (const l of listingLogs) {
      if (l.misAJourLe) {
        events.push({
          id: `listing-${l.id}`,
          type: 'ANNONCE_PUBLIEE',
          details: `Annonce "${l.titre}" approuvée et publiée au catalogue`,
          date: l.misAJourLe,
          status: 'SUCCESS',
        });
      }
    }

    for (const r of retraitLogs) {
      if (r.demandeeLe) {
        events.push({
          id: `retrait-${r.id}`,
          type: 'RETRAIT_PAYE',
          details: `Décaissement de ${Number(r.montant).toLocaleString('fr-FR')} FCFA via ${r.methode}`,
          date: r.demandeeLe,
          status: 'SUCCESS',
        });
      }
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
  }
}
