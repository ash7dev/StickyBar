import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateDisputeDto, ResolveDisputeDto } from './dto/disputes.dto';
import {
  StatutReservation,
  StatutLitige,
  RoleLitige,
  TypeFaute
} from '@prisma/client';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refundPayment: RefundPaymentUseCase,
  ) {}

  /**
   * Ouvrir un litige
   */
  async create(auteurId: string, dto: CreateDisputeDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation introuvable');
    }

    const isLocataire = reservation.locataireId === auteurId;
    const isProprio = reservation.proprietaireId === auteurId;

    if (!isLocataire && !isProprio) {
      throw new ForbiddenException('Vous n\'êtes pas partie prenante de cette réservation');
    }

    // 1. Validations selon le rôle et le statut
    if (isLocataire) {
      // Le locataire peut ouvrir un litige si CONFIRMED (refus check-in) ou COMPLETED
      const autorise = (([StatutReservation.CONFIRMED, StatutReservation.COMPLETED] as StatutReservation[]).includes(reservation.statut));
      if (!autorise) {
        throw new UnprocessableEntityException('Litige non autorisé pour ce statut de réservation');
      }
    } else {
      // Le proprio peut ouvrir un litige UNIQUEMENT si COMPLETED
      if (reservation.statut !== StatutReservation.COMPLETED) {
        throw new UnprocessableEntityException('Le propriétaire ne peut ouvrir un litige que sur une réservation terminée');
      }
    }

    // 2. Vérifier la fenêtre des 24h si COMPLETED
    if (reservation.statut === StatutReservation.COMPLETED && reservation.closeLe) {
      const now = new Date();
      const expirationDate = new Date(reservation.closeLe);
      expirationDate.setHours(expirationDate.getHours() + 24);

      if (now > expirationDate) {
        throw new UnprocessableEntityException('Le délai de 24h pour ouvrir un litige est dépassé');
      }
    }

    // 3. Créer le litige et passer la réservation en DISPUTED
    const result = await this.prisma.$transaction(async (tx) => {
      const litige = await tx.litige.create({
        data: {
          reservationId: dto.reservationId,
          declarePar: isLocataire ? RoleLitige.LOCATAIRE : RoleLitige.PROPRIETAIRE,
          motif: dto.motif,
          description: dto.description,
          statut: StatutLitige.EN_ATTENTE,
        },
      });

      await tx.reservation.update({
        where: { id: dto.reservationId },
        data: { statut: StatutReservation.DISPUTED },
      });

      return litige;
    });

    this.logger.log(`Litige ouvert [${result.id}] pour la réservation [${dto.reservationId}]`);
    return result;
  }

  /**
   * Lister les litiges pour l'admin
   */
  async listForAdmin(statut?: StatutLitige) {
    return this.prisma.litige.findMany({
      where: statut ? { statut } : {},
      include: {
        reservation: {
          include: {
            locataire: { select: { id: true, prenom: true, nom: true, email: true, telephone: true } },
            proprietaire: { select: { id: true, prenom: true, nom: true, email: true, telephone: true } },
            logement: { select: { id: true, titre: true, ville: true } },
            photosEtatLieu: true, // Pour comparaison
          }
        }
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  /**
   * Résolution du litige par l'admin
   */
  async resolve(id: string, adminId: string, dto: ResolveDisputeDto) {
    const litige = await this.prisma.litige.findUnique({
      where: { id },
      include: { reservation: true },
    });

    if (!litige) throw new NotFoundException('Litige introuvable');
    if (litige.statut !== StatutLitige.EN_ATTENTE) {
      throw new ConflictException('Ce litige a déjà été traité');
    }

    const { reservation } = litige;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le litige
      const updatedLitige = await tx.litige.update({
        where: { id },
        data: {
          statut: dto.statut,
          decisionAdmin: dto.decisionAdmin,
          resoluLe: new Date(),
          resoluParAdminId: adminId,
        },
      });

      // 2. Si FONDE : Sanctions et conséquences
      if (dto.statut === StatutLitige.FONDE) {
        const estLocataireVictime = litige.declarePar === RoleLitige.LOCATAIRE;

        if (estLocataireVictime) {
          // Marquer la réservation comme annulée
          await tx.reservation.update({
            where: { id: litige.reservationId },
            data: { statut: StatutReservation.CANCELLED },
          });

          // Ajouter une faute au propriétaire
          await tx.compteurFaute.create({
            data: {
              utilisateurId: reservation.proprietaireId,
              type: TypeFaute.NON_CONFORMITE_LOGEMENT,
              reservationId: reservation.id,
              description: `Litige FONDE : ${dto.decisionAdmin}`,
            },
          });
        } else {
          // Proprio victime (ex: dommages ou dépassement personnes)
          await tx.reservation.update({
            where: { id: litige.reservationId },
            data: { statut: StatutReservation.COMPLETED },
          });

          await tx.compteurFaute.create({
            data: {
              utilisateurId: reservation.locataireId,
              type: TypeFaute.DEPASSEMENT_PERSONNES,
              reservationId: reservation.id,
              description: `Litige FONDE : ${dto.decisionAdmin}`,
            },
          });
        }
      } else {
        // 3. Si NON_FONDE : Retour à COMPLETED
        await tx.reservation.update({
          where: { id: litige.reservationId },
          data: { statut: StatutReservation.COMPLETED },
        });
      }

      this.logger.log(`Litige [${id}] résolu par l'admin [${adminId}] : ${dto.statut}`);
      return { updatedLitige, litige };
    });

    // 3. Après la transaction : Initier le remboursement si locataire victime
    if (dto.statut === StatutLitige.FONDE && result.litige.declarePar === RoleLitige.LOCATAIRE) {
      try {
        await this.refundPayment.execute(result.litige.reservationId, 100);
        this.logger.log(`Remboursement 100% initié pour la réservation ${result.litige.reservationId} suite au litige ${id}`);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Échec du remboursement pour le litige ${id} (réservation ${result.litige.reservationId}): ${err.message}`,
          err.stack
        );
        // Ne pas faire échouer la résolution du litige si le remboursement échoue
        // Le remboursement pourra être retenté manuellement
      }
    }

    return result.updatedLitige;
  }
}
