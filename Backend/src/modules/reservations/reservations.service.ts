import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { CreateReservationUseCase, CreateReservationInput } from '../../domain/reservation/use-cases/create-reservation.use-case';
import { ConfirmReservationUseCase } from '../../domain/reservation/use-cases/confirm-reservation.use-case';
import { CancelReservationUseCase } from '../../domain/reservation/use-cases/cancel-reservation.use-case';
import { CheckInUploadPhotosUseCase } from '../../domain/reservation/use-cases/checkin-upload-photos.use-case';
import { CheckInConfirmUseCase } from '../../domain/reservation/use-cases/checkin-confirm.use-case';
import { CheckInRefuseUseCase } from '../../domain/reservation/use-cases/checkin-refuse.use-case';
import { ProprioAbsentUseCase } from '../../domain/reservation/use-cases/proprio-absent.use-case';
import { CheckOutUploadPhotosUseCase } from '../../domain/reservation/use-cases/checkout-upload-photos.use-case';
import { CheckoutUseCase } from '../../domain/reservation/use-cases/checkout.use-case';
import { AutoClotureUseCase } from '../../domain/reservation/use-cases/auto-cloture.use-case';
import { AddEtatLieuxPhotoUseCase, AddEtatLieuxPhotoInput } from '../../domain/reservation/use-cases/add-etat-lieux-photo.use-case';
import { CheckinProprioUseCase } from '../../domain/reservation/use-cases/checkin-proprio.use-case';
import { CheckoutProprioUseCase } from '../../domain/reservation/use-cases/checkout-proprio.use-case';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser, Role } from '../../shared/types/jwt-payload.type';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { StatutReservation, TypeAvis } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly createUseCase: CreateReservationUseCase,
    private readonly confirmUseCase: ConfirmReservationUseCase,
    private readonly cancelUseCase: CancelReservationUseCase,
    private readonly checkinUploadUseCase: CheckInUploadPhotosUseCase,
    private readonly checkinConfirmUseCase: CheckInConfirmUseCase,
    private readonly checkinRefuseUseCase: CheckInRefuseUseCase,
    private readonly proprioAbsentUseCase: ProprioAbsentUseCase,
    private readonly checkoutUploadUseCase: CheckOutUploadPhotosUseCase,
    private readonly checkoutUseCase: CheckoutUseCase,
    private readonly autoClotureUseCase: AutoClotureUseCase,
    private readonly addEtatLieuxPhotoUseCase: AddEtatLieuxPhotoUseCase,
    private readonly checkinProprioUseCase: CheckinProprioUseCase,
    private readonly checkoutProprioUseCase: CheckoutProprioUseCase,
  ) {}

  async findMine(userId: string, activeRole: Role, statut?: StatutReservation) {
    const isProprietaire = activeRole === Role.PROPRIETAIRE;
    return this.prisma.reservation.findMany({
      where: {
        ...(isProprietaire ? { proprietaireId: userId } : { locataireId: userId }),
        ...(statut ? { statut } : {}),
      },
      orderBy: { creeLe: 'desc' },
      include: {
        locataire: { select: { id: true, prenom: true, nom: true, avatarUrl: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, avatarUrl: true } },
        logement: {
          select: {
            id: true, titre: true, ville: true,
            photos: { take: 1, where: { estPrincipale: true }, select: { url: true } },
          },
        },
        paiement: { select: { statut: true, fournisseur: true } },
        litige: { select: { id: true, statut: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.reservation.findFirst({
      where: {
        id,
        OR: [{ locataireId: userId }, { proprietaireId: userId }],
      },
      include: {
        locataire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true, email: true, statutKyc: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true } },
        logement: {
          select: {
            id: true, titre: true, ville: true, adresse: true,
            photos: { take: 1, where: { estPrincipale: true }, select: { url: true } },
          },
        },
        paiement: true,
        photosEtatLieu: true,
        litige: true,
        historique: { orderBy: { modifieLe: 'desc' }, take: 20 },
      },
    });
  }

  async create(user: AuthUser, dto: CreateReservationDto, idempotencyKey?: string) {
    return this.createUseCase.execute(user, dto as CreateReservationInput, idempotencyKey);
  }

  async confirm(id: string, userId: string, heureDebut?: string) {
    return this.confirmUseCase.execute(id, userId, heureDebut);
  }

  async cancel(id: string, userId: string, raison: string) {
    return this.cancelUseCase.execute(id, userId, raison);
  }

  async uploadCheckInPhotos(id: string, userId: string, photos: string[]) {
    return this.checkinUploadUseCase.execute(id, userId, photos);
  }

  async confirmCheckIn(id: string, userId: string) {
    return this.checkinConfirmUseCase.execute(id, userId);
  }

  async refuseCheckIn(id: string, userId: string, motif: string, commentaire: string) {
    return this.checkinRefuseUseCase.execute(id, userId, motif, commentaire);
  }

  async reportProprioAbsent(id: string, userId: string) {
    return this.proprioAbsentUseCase.execute(id, userId);
  }

  async uploadCheckOutPhotos(id: string, userId: string, photos: string[]) {
    return this.checkoutUploadUseCase.execute(id, userId, photos);
  }

  async completeCheckout(id: string, userId: string) {
    return this.checkoutUseCase.execute(id, userId);
  }

  async autoCloture(id: string) {
    return this.autoClotureUseCase.execute(id);
  }

  getEtatLieuxUploadParams(reservationId: string) {
    return this.cloudinary.generateUploadSignature(`immoloc/etat-lieux/${reservationId}`);
  }

  addEtatLieuxPhoto(id: string, userId: string, dto: AddEtatLieuxPhotoInput) {
    return this.addEtatLieuxPhotoUseCase.execute(id, userId, dto);
  }

  checkinProprio(id: string, userId: string) {
    return this.checkinProprioUseCase.execute(id, userId);
  }

  checkoutProprio(id: string, userId: string) {
    return this.checkoutProprioUseCase.execute(id, userId);
  }

  /**
   * Signal tenant no-show (owner only, T+2h after start)
   */
  async signalTenantNoshow(userId: string, reservationId: string, commentaire?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Pessimistic lock sur la réservation
      const reservation = await tx.$queryRaw<Array<{
        id: string;
        proprietaireId: string;
        locataireId: string;
        statut: string;
        dateDebut: Date;
      }>>`
        SELECT id, "proprietaireId", "locataireId", statut, "dateDebut"
        FROM "Reservation"
        WHERE id = ${reservationId}
        FOR UPDATE
      `.then(rows => rows[0]);

      if (!reservation) {
        throw new NotFoundException('Réservation introuvable');
      }

      if (reservation.proprietaireId !== userId) {
        throw new BadRequestException('Seul le propriétaire peut signaler une absence');
      }

      if (reservation.statut !== 'CONFIRMED') {
        throw new BadRequestException('La réservation doit être confirmée');
      }

      const now = new Date();
      const twoHoursAfterStart = new Date(reservation.dateDebut.getTime() + 2 * 60 * 60 * 1000);
      if (now < twoHoursAfterStart) {
        throw new BadRequestException(
          'Vous pouvez signaler l\'absence du locataire uniquement 2h après l\'heure de début prévue'
        );
      }

      // Create historique entry for detection in auto-cancel logic
      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut as StatutReservation,
          nouveauStatut: reservation.statut as StatutReservation,
          modifiePar: 'OWNER_SIGNAL_TENANT_NOSHOW',
          raison: commentaire || 'Locataire absent - No-show signalé',
        },
      });

      return { message: 'Absence signalée. La réservation sera annulée automatiquement si le locataire ne se présente pas.' };
    }, { isolationLevel: 'RepeatableRead' });
  }

  /**
   * Rate tenant (owner only, reservation must be COMPLETED)
   */
  async rateTenant(userId: string, reservationId: string, note: number, commentaire?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Pessimistic lock sur la réservation pour éviter les notations concurrentes
      const reservation = await tx.$queryRaw<Array<{
        id: string;
        proprietaireId: string;
        locataireId: string;
        logementId: string;
        statut: string;
      }>>`
        SELECT id, "proprietaireId", "locataireId", "logementId", statut
        FROM "Reservation"
        WHERE id = ${reservationId}
        FOR UPDATE
      `.then(rows => rows[0]);

      if (!reservation) {
        throw new NotFoundException('Réservation introuvable');
      }

      if (reservation.proprietaireId !== userId) {
        throw new BadRequestException('Seul le propriétaire peut noter le locataire');
      }

      if (reservation.statut !== 'COMPLETED') {
        throw new BadRequestException('La réservation doit être terminée pour noter le locataire');
      }

      // Check if rating already exists
      const existingRating = await tx.avis.findUnique({
        where: {
          reservationId_auteurId: {
            reservationId,
            auteurId: userId,
          },
        },
      });

      if (existingRating) {
        throw new BadRequestException('Vous avez déjà noté ce locataire pour cette réservation');
      }

      // Create rating
      await tx.avis.create({
        data: {
          reservationId,
          auteurId: userId,
          cibleId: reservation.locataireId,
          logementId: reservation.logementId,
          note,
          commentaire,
          typeAvis: TypeAvis.PROPRIO_NOTE_LOCATAIRE,
        },
      });

      return { locataireId: reservation.locataireId, note };
    }, { isolationLevel: 'RepeatableRead' });

    // Update tenant's average rating outside transaction to avoid deadlocks
    await this.updateUserAverageRating(result.locataireId, 'LOCATAIRE');

    return { message: `Évaluation de ${result.note}/5 publiée avec succès` };
  }

  /**
   * Rate owner (tenant only, reservation must be COMPLETED)
   */
  async rateOwner(userId: string, reservationId: string, note: number, commentaire?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Pessimistic lock sur la réservation pour éviter les notations concurrentes
      const reservation = await tx.$queryRaw<Array<{
        id: string;
        proprietaireId: string;
        locataireId: string;
        logementId: string;
        statut: string;
      }>>`
        SELECT id, "proprietaireId", "locataireId", "logementId", statut
        FROM "Reservation"
        WHERE id = ${reservationId}
        FOR UPDATE
      `.then(rows => rows[0]);

      if (!reservation) {
        throw new NotFoundException('Réservation introuvable');
      }

      if (reservation.locataireId !== userId) {
        throw new BadRequestException('Seul le locataire peut noter le propriétaire');
      }

      if (reservation.statut !== 'COMPLETED') {
        throw new BadRequestException('La réservation doit être terminée pour noter le propriétaire');
      }

      // Check if rating already exists
      const existingRating = await tx.avis.findUnique({
        where: {
          reservationId_auteurId: {
            reservationId,
            auteurId: userId,
          },
        },
      });

      if (existingRating) {
        throw new BadRequestException('Vous avez déjà noté ce propriétaire pour cette réservation');
      }

      // Create rating
      await tx.avis.create({
        data: {
          reservationId,
          auteurId: userId,
          cibleId: reservation.proprietaireId,
          logementId: reservation.logementId,
          note,
          commentaire,
          typeAvis: TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO,
        },
      });

      return { proprietaireId: reservation.proprietaireId, note };
    }, { isolationLevel: 'RepeatableRead' });

    // Update owner's average rating outside transaction to avoid deadlocks
    await this.updateUserAverageRating(result.proprietaireId, 'PROPRIETAIRE');

    return { message: `Évaluation de ${result.note}/5 publiée avec succès` };
  }

  /**
   * Recalculate and update user's average rating atomically
   * Uses aggregation within transaction to avoid race conditions
   */
  private async updateUserAverageRating(userId: string, type: 'LOCATAIRE' | 'PROPRIETAIRE') {
    const avisType = type === 'LOCATAIRE'
      ? TypeAvis.PROPRIO_NOTE_LOCATAIRE
      : TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO;

    await this.prisma.$transaction(async (tx) => {
      // Pessimistic lock sur l'utilisateur pour éviter les race conditions lors de mises à jour concurrentes
      await tx.$queryRaw`
        SELECT id FROM "Utilisateur"
        WHERE id = ${userId}
        FOR UPDATE
      `;

      // Utiliser l'agrégation directe en base de données pour éviter les race conditions
      const result = await tx.avis.aggregate({
        where: { cibleId: userId, typeAvis: avisType },
        _avg: { note: true },
        _count: { id: true },
      });

      // Si aucun avis, ne rien faire
      if (!result._count.id || result._count.id === 0) {
        return;
      }

      // L'agrégation garantit que nous avons les données les plus récentes
      const average = result._avg.note || 0;
      const count = result._count.id;

      const fieldName = type === 'LOCATAIRE' ? 'noteLocataire' : 'noteProprietaire';

      await tx.utilisateur.update({
        where: { id: userId },
        data: {
          [fieldName]: new Decimal(average.toFixed(2)),
          totalAvis: count,
        },
      });
    }, { isolationLevel: 'Serializable' });
  }
}
