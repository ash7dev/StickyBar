import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ownedLogements } from '../owner-scope';
import { CreateOwnerBlockDto, OwnerCalendarQueryDto } from './dto/owner-calendar.dto';
import {
  DayRange,
  addDays,
  coveringRange,
  daysBetween,
  parseDay,
  rangesOverlap,
  rangesTouch,
  toDay,
} from './day-range';

/** Période maximale renvoyée par GET /dashboard/owner/calendar. */
export const MAX_CALENDAR_SPAN_DAYS = 93;

/** Durée maximale d'un blocage manuel. */
export const MAX_BLOCK_SPAN_DAYS = 366;

/** Réservations affichées sur le calendrier (les annulées / expirées sont masquées). */
const VISIBLE_STATUSES: StatutReservation[] = [
  StatutReservation.PENDING,
  StatutReservation.PAID,
  StatutReservation.CONFIRMED,
  StatutReservation.CHECKED_IN,
  StatutReservation.COMPLETED,
  StatutReservation.DISPUTED,
];

/** Réservations qui occupent le logement (même liste que create-reservation.use-case). */
const BLOCKING_STATUSES: StatutReservation[] = [
  StatutReservation.PENDING,
  StatutReservation.PAID,
  StatutReservation.CONFIRMED,
  StatutReservation.CHECKED_IN,
];

export interface CalendarLogement {
  id: string;
  titre: string;
  ville: string;
  statut: string;
  prixBase: number;
  photoUrl: string | null;
}

export interface CalendarReservationEvent {
  kind: 'RESERVATION';
  id: string;
  logementId: string;
  start: string;
  end: string;
  statut: StatutReservation;
  nbNuits: number;
  nbPersonnes: number;
  netProprietaire: number;
  /** Formule acompte : solde que le voyageur règle à l'hôte sur place (0 sinon). */
  soldeSurPlace: number;
  /** Heures d'arrivée et de départ « HH:mm » (Dakar = UTC), fixées à la confirmation. */
  heureArrivee: string;
  heureDepart: string;
  locataire: { prenom: string; nomInitiale: string; avatarUrl: string | null };
}

export interface CalendarBlockEvent {
  kind: 'BLOCK';
  id: string;
  logementId: string;
  start: string;
  end: string;
  motif: string | null;
}

export type CalendarEvent = CalendarReservationEvent | CalendarBlockEvent;

export interface OwnerCalendarResponse {
  range: DayRange;
  logements: CalendarLogement[];
  events: CalendarEvent[];
}

@Injectable()
export class OwnerCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vue multi-logements : réservations + blocages sur une période.
   */
  async getCalendar(userId: string, query: OwnerCalendarQueryDto): Promise<OwnerCalendarResponse> {
    const range = this.validateRange(query.from, query.to, MAX_CALENDAR_SPAN_DAYS);

    const from = parseDay(range.start);
    const to = parseDay(range.end);
    // Un seul aller-retour réseau : les trois lectures partent en parallèle et
    // filtrent chacune par « logements de l'utilisateur » (+ sélection éventuelle).
    const scope = {
      ...ownedLogements(userId),
      ...(query.logementIds?.length ? { id: { in: query.logementIds } } : {}),
    };

    const [logements, reservations, blocks] = await Promise.all([
      this.prisma.logement.findMany({
        where: scope,
        orderBy: { creeLe: 'asc' },
        select: {
          id: true,
          titre: true,
          ville: true,
          statut: true,
          prixBase: true,
          photos: { where: { estPrincipale: true }, select: { url: true }, take: 1 },
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          logement: scope,
          statut: { in: VISIBLE_STATUSES },
          dateDebut: { lt: to },
          dateFin: { gt: from },
        },
        orderBy: { dateDebut: 'asc' },
        select: {
          id: true,
          logementId: true,
          dateDebut: true,
          dateFin: true,
          statut: true,
          nbNuits: true,
          nbPersonnes: true,
          netProprietaire: true,
          typePaiement: true,
          montantSoldeRestant: true,
          locataire: { select: { prenom: true, nom: true, avatarUrl: true } },
        },
      }),
      this.prisma.indisponibiliteLogement.findMany({
        where: {
          logement: scope,
          dateDebut: { lt: to },
          dateFin: { gt: from },
        },
        orderBy: { dateDebut: 'asc' },
        select: { id: true, logementId: true, dateDebut: true, dateFin: true, motif: true },
      }),
    ]);

    const events: CalendarEvent[] = [
      ...reservations.map(
        (r): CalendarReservationEvent => ({
          kind: 'RESERVATION',
          id: r.id,
          logementId: r.logementId,
          start: toDay(r.dateDebut),
          end: toDay(r.dateFin),
          statut: r.statut,
          nbNuits: r.nbNuits,
          nbPersonnes: r.nbPersonnes,
          netProprietaire: Number(r.netProprietaire),
          soldeSurPlace: r.typePaiement?.toUpperCase() === 'DEPOSIT' ? Number(r.montantSoldeRestant ?? 0) : 0,
          heureArrivee: r.dateDebut.toISOString().slice(11, 16),
          heureDepart: r.dateFin.toISOString().slice(11, 16),
          locataire: {
            prenom: r.locataire.prenom,
            nomInitiale: r.locataire.nom ? `${r.locataire.nom.charAt(0).toUpperCase()}.` : '',
            avatarUrl: r.locataire.avatarUrl ?? null,
          },
        }),
      ),
      ...blocks.map(
        (b): CalendarBlockEvent => ({
          kind: 'BLOCK',
          id: b.id,
          logementId: b.logementId,
          start: toDay(b.dateDebut),
          end: toDay(b.dateFin),
          motif: b.motif,
        }),
      ),
    ];

    return {
      range,
      logements: logements.map((l) => ({
        id: l.id,
        titre: l.titre,
        ville: l.ville,
        statut: l.statut,
        prixBase: Number(l.prixBase),
        photoUrl: l.photos[0]?.url ?? null,
      })),
      events,
    };
  }

  /**
   * Bloque la même période sur un ou plusieurs logements.
   *
   * - Tout ou rien : si un seul logement est déjà réservé sur la période, rien n'est créé (409).
   * - Les blocages existants qui chevauchent ou touchent la période sont fusionnés en un seul.
   */
  async createBlocks(userId: string, dto: CreateOwnerBlockDto): Promise<CalendarBlockEvent[]> {
    const period = this.validateRange(dto.dateDebut, dto.dateFin, MAX_BLOCK_SPAN_DAYS);
    if (period.start < toDay(new Date())) {
      throw new BadRequestException('Impossible de bloquer des dates passées');
    }

    const motif = dto.motif?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const logements = await tx.logement.findMany({
        where: { ...ownedLogements(userId), id: { in: dto.logementIds } },
        select: { id: true, titre: true },
      });
      if (logements.length !== dto.logementIds.length) {
        throw new NotFoundException('Un ou plusieurs logements sont introuvables');
      }

      await this.assertNoReservationConflict(tx, logements, period);

      const created: CalendarBlockEvent[] = [];
      for (const logement of logements) {
        created.push(await this.upsertMergedBlock(tx, logement.id, period, motif));
      }
      return created;
    });
  }

  async deleteBlock(userId: string, blockId: string): Promise<{ id: string }> {
    const block = await this.prisma.indisponibiliteLogement.findFirst({
      where: { id: blockId, logement: ownedLogements(userId) },
      select: { id: true },
    });
    if (!block) throw new NotFoundException('Blocage introuvable');

    await this.prisma.indisponibiliteLogement.delete({ where: { id: block.id } });
    return { id: block.id };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private validateRange(start: string, end: string, maxDays: number): DayRange {
    try {
      parseDay(start);
      parseDay(end);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
    const span = daysBetween(start, end);
    if (span <= 0) {
      throw new BadRequestException('La date de fin doit être après la date de début');
    }
    if (span > maxDays) {
      throw new BadRequestException(`La période ne peut pas dépasser ${maxDays} jours`);
    }
    return { start, end };
  }

  private async assertNoReservationConflict(
    tx: Prisma.TransactionClient,
    logements: Array<{ id: string; titre: string }>,
    period: DayRange,
  ): Promise<void> {
    // Fenêtre élargie d'un jour : les dates de réservation sont des DateTime,
    // la comparaison fine se fait ensuite au jour près.
    const conflicts = await tx.reservation.findMany({
      where: {
        logementId: { in: logements.map((l) => l.id) },
        statut: { in: BLOCKING_STATUSES },
        dateDebut: { lt: parseDay(addDays(period.end, 1)) },
        dateFin: { gt: parseDay(addDays(period.start, -1)) },
      },
      select: { logementId: true, dateDebut: true, dateFin: true },
    });

    const real = conflicts.filter((r) =>
      rangesOverlap({ start: toDay(r.dateDebut), end: toDay(r.dateFin) }, period),
    );
    if (real.length === 0) return;

    const titles = new Map(logements.map((l) => [l.id, l.titre]));
    const details = real
      .map((r) => `${titles.get(r.logementId)} (${toDay(r.dateDebut)} → ${toDay(r.dateFin)})`)
      .join(', ');
    throw new ConflictException(`Dates déjà réservées : ${details}`);
  }

  /** Crée le blocage, en absorbant les blocages existants qui le chevauchent ou le touchent. */
  private async upsertMergedBlock(
    tx: Prisma.TransactionClient,
    logementId: string,
    period: DayRange,
    motif: string | null,
  ): Promise<CalendarBlockEvent> {
    const neighbours = await tx.indisponibiliteLogement.findMany({
      where: {
        logementId,
        dateDebut: { lte: parseDay(period.end) },
        dateFin: { gte: parseDay(period.start) },
      },
      select: { id: true, dateDebut: true, dateFin: true, motif: true },
    });

    const touching = neighbours.filter((b) =>
      rangesTouch({ start: toDay(b.dateDebut), end: toDay(b.dateFin) }, period),
    );
    const merged = coveringRange([
      period,
      ...touching.map((b) => ({ start: toDay(b.dateDebut), end: toDay(b.dateFin) })),
    ]);

    if (touching.length > 0) {
      await tx.indisponibiliteLogement.deleteMany({
        where: { id: { in: touching.map((b) => b.id) } },
      });
    }

    const block = await tx.indisponibiliteLogement.create({
      data: {
        logementId,
        dateDebut: parseDay(merged.start),
        dateFin: parseDay(merged.end),
        motif: motif ?? touching.find((b) => b.motif)?.motif ?? null,
      },
      select: { id: true, logementId: true, dateDebut: true, dateFin: true, motif: true },
    });

    return {
      kind: 'BLOCK',
      id: block.id,
      logementId: block.logementId,
      start: toDay(block.dateDebut),
      end: toDay(block.dateFin),
      motif: block.motif,
    };
  }
}
