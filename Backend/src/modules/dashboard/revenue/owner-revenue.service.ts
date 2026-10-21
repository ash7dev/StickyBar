import { Injectable } from '@nestjs/common';
import { StatutReservation, StatutRetrait, TypeTransactionWallet } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DayRange, monthStart, parseDay, toDay } from '../calendar/day-range';
import { ownedLogements } from '../owner-scope';
import { payoutAmount } from '../payout';
import { Occupancy, computeOccupancy } from '../overview/occupancy';
import {
  HISTORY_MONTHS,
  MonthWindow,
  RevenuePeriod,
  lastMonths,
  periodMonths,
} from './revenue-period';

/** Séjours qui génèrent un revenu, comptés au mois de leur arrivée. */
const REVENUE_STATUSES: StatutReservation[] = [
  StatutReservation.CONFIRMED,
  StatutReservation.CHECKED_IN,
  StatutReservation.COMPLETED,
];
/** Séjours qui occupent des nuits (un litige n'efface pas le séjour). */
const STAY_STATUSES: StatutReservation[] = [...REVENUE_STATUSES, StatutReservation.DISPUTED];

const TIMELINE_UPCOMING = 4;
const TIMELINE_PAST = 4;

export interface RevenueMetrics {
  revenueNet: number;
  /** Nuits réservées dans la période (toutes arrivées confondues) */
  nightsSold: number;
  occupancy: Occupancy;
  /** Revenu net ÷ nuits des séjours arrivés dans la période ; null sans séjour */
  netPerNight: number | null;
  stays: number;
}

export interface MonthMetrics extends RevenueMetrics {
  month: string;
}

export type TimelineEvent =
  | { kind: 'UPCOMING'; date: string; amount: number; reservationId: string; locatairePrenom: string; logementTitre: string }
  | { kind: 'CREDITED'; date: string; amount: number; reservationId: string | null; locatairePrenom: string | null; logementTitre: string | null }
  | { kind: 'WITHDRAWAL'; date: string; amount: number; methode: string; statut: StatutRetrait };

export interface OwnerRevenueResponse {
  period: RevenuePeriod;
  range: { start: string; end: string };
  current: RevenueMetrics;
  previous: RevenueMetrics;
  /** 12 derniers mois, du plus ancien au mois en cours */
  history: MonthMetrics[];
  /** Revenu net des mêmes mois un an plus tôt (même ordre que `history`) */
  historyPreviousYear: Array<{ month: string; revenueNet: number }>;
  logements: Array<{ id: string; titre: string; ville: string; metrics: RevenueMetrics }>;
  wallet: {
    available: number;
    /** Séquestre : séjours confirmés dont le check-in n'est pas encore fait */
    escrow: number;
    withdrawnThisMonth: number;
  };
  timeline: TimelineEvent[];
}

type Stay = {
  logementId: string;
  dateDebut: Date;
  dateFin: Date;
  statut: StatutReservation;
  netProprietaire: unknown;
  nbNuits: number;
};
type Block = { logementId: string; dateDebut: Date; dateFin: Date };

const asRange = (r: { dateDebut: Date; dateFin: Date }): DayRange => ({ start: toDay(r.dateDebut), end: toDay(r.dateFin) });

/**
 * Indicateurs sur un ensemble de mois, pour un ou plusieurs logements.
 * L'occupation est calculée logement par logement puis additionnée.
 */
export function metricsFor(months: MonthWindow[], logementIds: string[], stays: Stay[], blocks: Block[]): RevenueMetrics {
  let revenueNet = 0;
  let arrivalNights = 0;
  let stayCount = 0;
  let bookedNights = 0;
  let availableNights = 0;

  for (const m of months) {
    for (const r of stays) {
      if (!REVENUE_STATUSES.includes(r.statut)) continue;
      const arrival = toDay(r.dateDebut);
      if (arrival >= m.start && arrival < m.end && logementIds.includes(r.logementId)) {
        revenueNet += Number(r.netProprietaire);
        arrivalNights += r.nbNuits;
        stayCount += 1;
      }
    }
    for (const id of logementIds) {
      const o = computeOccupancy(
        stays.filter((r) => r.logementId === id && STAY_STATUSES.includes(r.statut)).map(asRange),
        blocks.filter((b) => b.logementId === id).map(asRange),
        { start: m.start, end: m.end },
      );
      bookedNights += o.bookedNights;
      availableNights += o.availableNights;
    }
  }

  return {
    revenueNet,
    nightsSold: bookedNights,
    occupancy: {
      bookedNights,
      availableNights,
      rate: availableNights > 0 ? bookedNights / availableNights : 0,
    },
    netPerNight: arrivalNights > 0 ? Math.round(revenueNet / arrivalNights) : null,
    stays: stayCount,
  };
}

@Injectable()
export class OwnerRevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenue(userId: string, period: RevenuePeriod, now: Date = new Date()): Promise<OwnerRevenueResponse> {
    const today = toDay(now);
    const { current, previous } = periodMonths(period, today);
    const history = lastMonths(today, HISTORY_MONTHS);
    const historyLastYear = lastMonths(today, HISTORY_MONTHS, -12);

    // Fenêtre de lecture : du plus ancien mois utile jusqu'à la fin du mois en cours
    const from = [previous[0].start, historyLastYear[0].start].sort()[0];
    const to = monthStart(today, 1);

    // Un seul aller-retour : chaque requête filtre par « logements de l'utilisateur »
    const owned = ownedLogements(userId);
    const [logements, stays, blocks, wallet, upcoming, credits, withdrawals, withdrawnThisMonth] = await Promise.all([
      this.prisma.logement.findMany({
        where: owned,
        orderBy: { creeLe: 'asc' },
        select: { id: true, titre: true, ville: true },
      }),
      this.prisma.reservation.findMany({
        where: {
          logement: owned,
          statut: { in: STAY_STATUSES },
          dateDebut: { lt: parseDay(to) },
          dateFin: { gt: parseDay(from) },
        },
        select: { logementId: true, dateDebut: true, dateFin: true, statut: true, netProprietaire: true, nbNuits: true },
      }),
      this.prisma.indisponibiliteLogement.findMany({
        where: { logement: owned, dateDebut: { lt: parseDay(to) }, dateFin: { gt: parseDay(from) } },
        select: { logementId: true, dateDebut: true, dateFin: true },
      }),
      this.prisma.wallet.findUnique({ where: { utilisateurId: userId }, select: { id: true, soldeDisponible: true } }),
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
      this.prisma.transactionWallet.findMany({
        where: { wallet: { utilisateurId: userId }, type: TypeTransactionWallet.CREDIT_LOCATION },
        orderBy: { creeLe: 'desc' },
        take: TIMELINE_PAST,
        select: { reservationId: true, montant: true, creeLe: true },
      }),
      this.prisma.retrait.findMany({
        where: { wallet: { utilisateurId: userId } },
        orderBy: { demandeeLe: 'desc' },
        take: TIMELINE_PAST,
        select: { montant: true, methode: true, statut: true, demandeeLe: true },
      }),
      // Retraits comptés depuis la table Retrait : chaque retrait y figure une fois,
      // alors qu'il produit deux transactions DEBIT_RETRAIT (demande + trace de validation).
      this.prisma.retrait.aggregate({
        where: {
          wallet: { utilisateurId: userId },
          statut: { not: StatutRetrait.REJETE },
          demandeeLe: { gte: parseDay(monthStart(today)), lt: parseDay(to) },
        },
        _sum: { montant: true },
      }),
    ]);

    const ids = logements.map((l) => l.id);

    // Voyageur et logement des crédits récents (la transaction ne porte que l'id de réservation)
    const creditReservationIds = credits.map((c) => c.reservationId).filter((id): id is string => Boolean(id));
    const creditDetails = creditReservationIds.length
      ? await this.prisma.reservation.findMany({
          where: { id: { in: creditReservationIds } },
          select: { id: true, locataire: { select: { prenom: true } }, logement: { select: { titre: true } } },
        })
      : [];
    const detailById = new Map(creditDetails.map((r) => [r.id, r]));

    const payouts = upcoming.map((r) => ({ r, amount: payoutAmount(r) }));
    const timeline: TimelineEvent[] = [
      ...payouts.slice(0, TIMELINE_UPCOMING).map(({ r, amount }) => ({
        kind: 'UPCOMING' as const,
        date: toDay(r.dateDebut),
        amount,
        reservationId: r.id,
        locatairePrenom: r.locataire.prenom,
        logementTitre: r.logement.titre,
      })),
      ...[
        ...credits.map((c): TimelineEvent => {
          const detail = c.reservationId ? detailById.get(c.reservationId) : undefined;
          return {
            kind: 'CREDITED',
            date: toDay(c.creeLe),
            amount: Number(c.montant),
            reservationId: c.reservationId,
            locatairePrenom: detail?.locataire.prenom ?? null,
            logementTitre: detail?.logement.titre ?? null,
          };
        }),
        ...withdrawals.map((w): TimelineEvent => ({
          kind: 'WITHDRAWAL',
          date: toDay(w.demandeeLe),
          amount: Number(w.montant),
          methode: w.methode,
          statut: w.statut,
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, TIMELINE_PAST),
    ];

    return {
      period,
      range: { start: current[0].start, end: current[current.length - 1].end },
      current: metricsFor(current, ids, stays, blocks),
      previous: metricsFor(previous, ids, stays, blocks),
      history: history.map((m) => ({ month: m.month, ...metricsFor([m], ids, stays, blocks) })),
      historyPreviousYear: historyLastYear.map((m) => ({
        month: m.month,
        revenueNet: metricsFor([m], ids, stays, blocks).revenueNet,
      })),
      logements: logements.map((l) => ({ ...l, metrics: metricsFor(current, [l.id], stays, blocks) })),
      wallet: {
        available: Number(wallet?.soldeDisponible ?? 0),
        escrow: payouts.reduce((sum, p) => sum + p.amount, 0),
        withdrawnThisMonth: Number(withdrawnThisMonth._sum.montant ?? 0),
      },
      timeline,
    };
  }
}

