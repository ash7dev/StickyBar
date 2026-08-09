import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';
import { AdminReservationsQueryDto, ForceCancelReservationDto } from './dto/admin-reservations-query.dto';
import { Prisma, StatutReservation, StatutPaiement, ResultatAnnulation } from '@prisma/client';

@Injectable()
export class AdminReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refundPayment: RefundPaymentUseCase,
  ) {}

  async listReservations(dto: AdminReservationsQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.ReservationWhereInput = {
      ...(dto.statut && { statut: dto.statut }),
      ...(dto.search && {
        OR: [
          { id: { contains: dto.search, mode: 'insensitive' } },
          { locataire: { prenom: { contains: dto.search, mode: 'insensitive' } } },
          { locataire: { nom: { contains: dto.search, mode: 'insensitive' } } },
          { proprietaire: { prenom: { contains: dto.search, mode: 'insensitive' } } },
          { proprietaire: { nom: { contains: dto.search, mode: 'insensitive' } } },
          { logement: { titre: { contains: dto.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, reservations] = await Promise.all([
      this.prisma.reservation.count({ where }),
      this.prisma.reservation.findMany({
        where,
        select: {
          id: true,
          dateDebut: true,
          dateFin: true,
          nbNuits: true,
          nbPersonnes: true,
          totalLocataire: true,
          montantCommission: true,
          netProprietaire: true,
          statut: true,
          creeLe: true,
          locataire: {
            select: { id: true, prenom: true, nom: true, email: true, telephone: true },
          },
          proprietaire: {
            select: { id: true, prenom: true, nom: true, email: true, telephone: true },
          },
          logement: {
            select: { id: true, titre: true, ville: true, type: true },
          },
          paiement: {
            select: { statut: true, fournisseur: true, montant: true },
          },
          litige: {
            select: { id: true, statut: true, motif: true },
          },
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: reservations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReservationDetails(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        locataire: true,
        proprietaire: true,
        logement: {
          include: {
            photos: { where: { estPrincipale: true } },
          },
        },
        paiement: true,
        photosEtatLieu: true,
        litige: true,
        historique: {
          orderBy: { modifieLe: 'desc' },
        },
        refunds: true,
      },
    });

    if (!reservation) throw new NotFoundException(`Réservation ${id} introuvable`);
    return reservation;
  }

  async forceCancel(id: string, adminId: string, dto: ForceCancelReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { paiement: true },
    });

    if (!reservation) throw new NotFoundException(`Réservation ${id} introuvable`);

    if (
      reservation.statut === StatutReservation.CANCELLED ||
      reservation.statut === StatutReservation.COMPLETED
    ) {
      throw new BadRequestException(`Impossible d'annuler une réservation déjà ${reservation.statut}`);
    }

    const tauxRemboursement = dto.tauxRemboursementLocataire ?? 100;
    const montantRembourse = (Number(reservation.totalLocataire) * tauxRemboursement) / 100;

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          statut: StatutReservation.CANCELLED,
          annuleLe: now,
          annuleParId: adminId,
          raisonAnnulation: `[ANNULATION ADMIN] ${dto.raison}`,
          politiqueAppliquee: ResultatAnnulation.FORCE_MAJEURE,
        },
      });

      if (reservation.paiement && reservation.paiement.statut === StatutPaiement.CONFIRME) {
        await tx.paiement.update({
          where: { reservationId: id },
          data: {
            statut: StatutPaiement.REMBOURSE,
            rembourseLe: now,
            montantRembourse: montantRembourse,
          },
        });
      }

      await tx.reservationHistorique.create({
        data: {
          reservationId: id,
          ancienStatut: reservation.statut,
          nouveauStatut: StatutReservation.CANCELLED,
          modifiePar: adminId,
          raison: `Annulation forcée par l'administrateur (${tauxRemboursement}% remboursé) : ${dto.raison}`,
        },
      });

      return updated;
    });

    if (montantRembourse > 0) {
      try {
        await this.refundPayment.execute(id, tauxRemboursement);
      } catch (err) {
        // Enregistrer l'échec financier sans bloquer l’annulation de la réservation
      }
    }

    return {
      success: true,
      reservationId: result.id,
      statut: result.statut,
      montantRembourse,
      message: `Réservation annulée avec succès par l'administrateur.`,
    };
  }
}
