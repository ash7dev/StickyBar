import { Injectable } from '@nestjs/common';
import { StatutLogement, StatutReservation, TypeAvis } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DayRange, addDays, monthStart, parseDay, toDay } from '../calendar/day-range';
import { ownedLogements } from '../owner-scope';
import { payoutAmount } from '../payout';
import { Occupancy, computeOccupancy, freeNights } from './occupancy';

/** Nombre de mois de l'historique de revenus (mois en cours inclus). */
export const REVENUE_MONTHS = 6;
/** Fenêtre glissante du taux d'occupation global. */
export const OCCUPANCY_WINDOW_DAYS = 30;
/** Horizon des conseils « nuits libres à remplir ». */
export const TIP_HORIZON_DAYS = 14;
/** Seuil de nuits libres sur l'horizon à partir duquel on signale un logement. */
export const TIP_MIN_FREE_NIGHTS = 7;
const MAX_TIPS = 2;
const MAX_PAYOUTS_LISTED = 5;

/** Séjours qui génèrent un revenu (les demandes et annulations sont exclues). */
const REVENUE_STATUSES: StatutReservation[] = [
  StatutReservation.CONFIRMED,
  StatutReservation.CHECKED_IN,
  StatutReservation.COMPLETED,
];
/** Séjours qui comptent dans l'occupation (un litige n'efface pas le séjour). */
const STAY_STATUSES: StatutReservation[] = [...REVENUE_STATUSES, StatutReservation.DISPUTED];
/** Tout ce qui rend une nuit indisponible à la réservation (même règle que create-reservation). */
const OCCUPYING_STATUSES: StatutReservation[] = [
  StatutReservation.PENDING,
  StatutReservation.PAID,
  StatutReservation.CONFIRMED,
  StatutReservation.CHECKED_IN,
];

export interface OverviewLogement {
  id: string;
  titre: string;
  ville: string;
  statut: StatutLogement;
  photoUrl: string | null;
  /** Mois en cours */
  occupancy: Occupancy;
  /** Revenu net des séjours arrivant ce mois-ci */
  revenueNet: number;
  /** Revenu net moyen par nuit de ces séjours ; null sans séjour */
  netPerNight: number | null;
}

export interface UpcomingPayout {
  reservationId: string;
  /** Jour du check-in : le séquestre est libéré à ce moment-là */
  date: string;
  amount: number;
  locatairePrenom: string;
  logementTitre: string;
}

export interface OwnerOverviewResponse {
  today: string;
  revenue: {
    currentMonth: number;
    previousMonth: number;
    /** Variation en %, null si le mois précédent est à 0 */
    changePct: number | null;
    /** Du plus ancien au mois en cours ; `month` = `YYYY-MM` */
    monthly: Array<{ month: string; revenue: number; stays: number }>;
  };
  occupancy: Occupancy & { windowDays: number };
  logements: OverviewLogement[];
  wallet: {
    available: number;
    upcomingTotal: number;
    upcomingPayouts: UpcomingPayout[];
  };
  reputation: {
    averageRating: number | null;
    totalReviews: number;
    lastReview: {
      note: number;
      commentaire: string | null;
      auteurPrenom: string;
      logementTitre: string | null;
      creeLe: string;
    } | null;
  };
  tips: Array<{
    kind: 'LOW_OCCUPANCY';
    logementId: string;
    logementTitre: string;
    freeNights: number;
    horizonDays: number;
  }>;
}

function sumOccupancies(list: Occupancy[]): Occupancy {
  const bookedNights = list.reduce((sum, o) => sum + o.bookedNights, 0);
  const availableNights = list.reduce((sum, o) => sum + o.availableNights, 0);
  return { bookedNights, availableNights, rate: availableNights > 0 ? bookedNights / availableNights : 0 };
}

@Injectable()
export class OwnerOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string, now: Date = new Date()): Promise<OwnerOverviewResponse> {
    const today = toDay(now);
    const thisMonth = monthStart(today, 0);
    const nextMonth = monthStart(today, 1);
    const firstMonth = monthStart(today, -(REVENUE_MONTHS - 1));
    const occupancyWindow: DayRange = { start: addDays(today, -OCCUPANCY_WINDOW_DAYS), end: today };
    const tipWindow: DayRange = { start: today, end: addDays(today, TIP_HORIZON_DAYS) };

    const fetchFrom = firstMonth < occupancyWindow.start ? firstMonth : occupancyWindow.start;
    const fetchTo = nextMonth > tipWindow.end ? nextMonth : tipWindow.end;

    // Tout part en parallèle (un seul aller-retour réseau) : les requêtes filtrent par
    // « logements de l'utilisateur » plutôt que d'attendre la liste des ids.
    const owned = ownedLogements(userId);
    const [logements, reservations, blocks, wallet, upcoming, ratingStats, lastReview] = await Promise.all([
      this.prisma.logement.findMany({
        where: owned,
        orderBy: { creeLe: 'asc' },
        select: {
          id: true,
          titre: true,
          ville: true,
          statut: true,
          photos: { where: { estPrincipale: true }, select: { url: true }, take: 1 },
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          logement: owned,
          statut: { in: [...STAY_STATUSES, StatutReservation.PENDING, StatutReservation.PAID] },
          dateDebut: { lt: parseDay(fetchTo) },
          dateFin: { gt: parseDay(fetchFrom) },
        },
        select: { logementId: true, dateDebut: true, dateFin: true, statut: true, netProprietaire: true, nbNuits: true },
      }),
      this.prisma.indisponibiliteLogement.findMany({
        where: {
          logement: owned,
          dateDebut: { lt: parseDay(fetchTo) },
          dateFin: { gt: parseDay(fetchFrom) },
        },
        select: { logementId: true, dateDebut: true, dateFin: true },
      }),
      this.prisma.wallet.findUnique({ where: { utilisateurId: userId }, select: { soldeDisponible: true } }),
      // Séquestre non encore libéré : confirmées, check-in pas encore fait
      this.prisma.reservation.findMany({
        where: { logement: owned, statut: StatutReservation.CONFIRMED },
        orderBy: { dateDebut: 'asc' },
        select: {
          id: true,
          dateDebut: true,
          typePaiement: true,
          netProprietaire: true,
          montantAcompte: true,
          montantCommission: true,
          locataire: { select: { prenom: true } },
          logement: { select: { titre: true } },
        },
      }),
      this.prisma.avis.aggregate({
        where: { logement: owned, typeAvis: TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO },
        _avg: { note: true },
        _count: { _all: true },
      }),
      this.prisma.avis.findFirst({
        where: { logement: owned, typeAvis: TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO },
        orderBy: { creeLe: 'desc' },
        select: {
          note: true,
          commentaire: true,
          creeLe: true,
          auteur: { select: { prenom: true } },
          logement: { select: { titre: true } },
        },
      }),
    ]);

    const asRange = (r: { dateDebut: Date; dateFin: Date }): DayRange => ({
      start: toDay(r.dateDebut),
      end: toDay(r.dateFin),
    });
    const stays = reservations.filter((r) => STAY_STATUSES.includes(r.statut));
    const revenueStays = reservations.filter((r) => REVENUE_STATUSES.includes(r.statut));
    const occupying = reservations.filter((r) => OCCUPYING_STATUSES.includes(r.statut));

    // ── Revenus par mois d'arrivée ──────────────────────────────────────────
    const monthly = Array.from({ length: REVENUE_MONTHS }, (_, i) => {
      const start = monthStart(today, i - (REVENUE_MONTHS - 1));
      const end = monthStart(start, 1);
      const inMonth = revenueStays.filter((r) => {
        const d = toDay(r.dateDebut);
        return d >= start && d < end;
      });
      return {
        month: start.slice(0, 7),
        revenue: inMonth.reduce((sum, r) => sum + Number(r.netProprietaire), 0),
        stays: inMonth.length,
      };
    });
    const currentMonth = monthly[monthly.length - 1].revenue;
    const previousMonth = monthly[monthly.length - 2]?.revenue ?? 0;

    // ── Par logement (mois en cours) ────────────────────────────────────────
    const monthWindow: DayRange = { start: thisMonth, end: nextMonth };
    const overviewLogements: OverviewLogement[] = logements.map((l) => {
      const own = <T extends { logementId: string }>(list: T[]) => list.filter((x) => x.logementId === l.id);
      const arrivals = own(revenueStays).filter((r) => {
        const d = toDay(r.dateDebut);
        return d >= thisMonth && d < nextMonth;
      });
      const revenueNet = arrivals.reduce((sum, r) => sum + Number(r.netProprietaire), 0);
      const nights = arrivals.reduce((sum, r) => sum + r.nbNuits, 0);
      return {
        id: l.id,
        titre: l.titre,
        ville: l.ville,
        statut: l.statut,
        photoUrl: l.photos[0]?.url ?? null,
        occupancy: computeOccupancy(own(stays).map(asRange), own(blocks).map(asRange), monthWindow),
        revenueNet,
        netPerNight: nights > 0 ? Math.round(revenueNet / nights) : null,
      };
    });

    // ── Conseils : logements publiés avec beaucoup de nuits libres ──────────
    const tips = logements
      .filter((l) => l.statut === StatutLogement.PUBLISHED)
      .map((l) => ({
        kind: 'LOW_OCCUPANCY' as const,
        logementId: l.id,
        logementTitre: l.titre,
        freeNights: freeNights(
          occupying.filter((r) => r.logementId === l.id).map(asRange),
          blocks.filter((b) => b.logementId === l.id).map(asRange),
          tipWindow,
        ),
        horizonDays: TIP_HORIZON_DAYS,
      }))
      .filter((t) => t.freeNights >= TIP_MIN_FREE_NIGHTS)
      .sort((a, b) => b.freeNights - a.freeNights)
      .slice(0, MAX_TIPS);

    const payouts: UpcomingPayout[] = upcoming.map((r) => ({
      reservationId: r.id,
      date: toDay(r.dateDebut),
      amount: payoutAmount(r),
      locatairePrenom: r.locataire.prenom,
      logementTitre: r.logement.titre,
    }));

    return {
      today,
      revenue: {
        currentMonth,
        previousMonth,
        changePct: previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : null,
        monthly,
      },
      occupancy: {
        // Calculé logement par logement puis additionné : deux biens occupés le même soir = 2 nuits
        ...sumOccupancies(
          logements.map((l) =>
            computeOccupancy(
              stays.filter((r) => r.logementId === l.id).map(asRange),
              blocks.filter((b) => b.logementId === l.id).map(asRange),
              occupancyWindow,
            ),
          ),
        ),
        windowDays: OCCUPANCY_WINDOW_DAYS,
      },
      logements: overviewLogements,
      wallet: {
        available: Number(wallet?.soldeDisponible ?? 0),
        upcomingTotal: payouts.reduce((sum, p) => sum + p.amount, 0),
        upcomingPayouts: payouts.slice(0, MAX_PAYOUTS_LISTED),
      },
      reputation: {
        averageRating:
          ratingStats._avg.note !== null ? Math.round(ratingStats._avg.note * 10) / 10 : null,
        totalReviews: ratingStats._count._all,
        lastReview: lastReview
          ? {
              note: lastReview.note,
              commentaire: lastReview.commentaire,
              auteurPrenom: lastReview.auteur.prenom,
              logementTitre: lastReview.logement?.titre ?? null,
              creeLe: lastReview.creeLe.toISOString(),
            }
          : null,
      },
      tips,
    };
  }
}
