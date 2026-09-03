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
import { NotificationsService } from '../notifications/notifications.service';
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
    private readonly notifications: NotificationsService,
  ) {}

  async findMine(userId: string, activeRole: Role, statut?: StatutReservation) {
    let roleWhere: any;
    if (activeRole === Role.GESTIONNAIRE) {
      roleWhere = {
        OR: [
          { proprietaireId: userId },
          { logement: { gestionnaireId: userId } },
        ],
      };
    } else if (activeRole === Role.PROPRIETAIRE) {
      roleWhere = { proprietaireId: userId };
    } else {
      roleWhere = { locataireId: userId };
    }

    return this.prisma.reservation.findMany({
      where: {
        ...roleWhere,
        ...(statut ? { statut } : {}),
      },
      orderBy: { creeLe: 'desc' },
      include: {
        locataire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true } },
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
        OR: [
          { locataireId: userId },
          { proprietaireId: userId },
          { logement: { gestionnaireId: userId } },
        ],
      },
      include: {
        locataire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true, email: true, statutKyc: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true } },
        logement: {
          select: {
            id: true, titre: true, ville: true, adresse: true, type: true, quartier: true,
            gestionnaireId: true,
            gestionnaire: {
              select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true, email: true },
            },
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

  async confirm(id: string, userId: string, heureDebut?: string, heureFin?: string) {
    return this.confirmUseCase.execute(id, userId, heureDebut, heureFin);
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

  /**
   * Extend owner absence timeout by +2 hours (tenant only)
   */
  async extendAbsentTimeout(userId: string, reservationId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException('Réservation introuvable');
      }

      if (reservation.locataireId !== userId) {
        throw new BadRequestException('Seul le locataire peut prolonger l\'attente');
      }

      if (reservation.statut !== 'CONFIRMED' || !reservation.absenceSignaleeLe) {
        throw new BadRequestException('Aucun signalement d\'absence actif sur cette réservation');
      }

      const currentSignalee = new Date(reservation.absenceSignaleeLe);
      const extendedSignalee = new Date(currentSignalee.getTime() + 2 * 60 * 60 * 1000);

      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          absenceSignaleeLe: extendedSignalee,
        },
      });

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut as StatutReservation,
          nouveauStatut: reservation.statut as StatutReservation,
          modifiePar: userId,
          raison: 'Prolongation de l\'attente hôte accordée par le locataire (+2h)',
        },
      });

      return updated;
    });
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
    const result = await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { logement: { select: { gestionnaireId: true } } },
      });

      if (!reservation) {
        throw new NotFoundException('Réservation introuvable');
      }

      const isOwnerOrManager = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;
      if (!isOwnerOrManager) {
        throw new BadRequestException('Seul le propriétaire ou le gestionnaire peut signaler une absence');
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

      return { locataireId: reservation.locataireId, message: 'Absence signalée. La réservation sera annulée automatiquement si le locataire ne se présente pas.' };
    }, { isolationLevel: 'RepeatableRead' });

    // Notification Push au locataire (URGENTE ⚠️)
    this.notifications.sendReservationPush(
      result.locataireId,
      '⚠️ Votre hôte a signalé votre absence !',
      'Votre hôte signale que vous ne vous êtes pas présenté. Veuillez le contacter immédiatement ou valider votre arrivée.',
      `/reservations/${reservationId}`
    ).catch(() => {});

    return { message: result.message };
  }

  /**
   * Reopen a no-show reservation for late check-in (owner or manager)
   */
  async reopenLateCheckin(userId: string, reservationId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { logement: { select: { gestionnaireId: true } } },
      });

      if (!reservation) {
        throw new NotFoundException('Réservation introuvable');
      }

      const isOwnerOrManager = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;
      if (!isOwnerOrManager) {
        throw new BadRequestException('Seul le propriétaire ou le gestionnaire peut réouvrir la réservation');
      }

      if (reservation.statut !== 'COMPLETED' && reservation.statut !== 'CANCELLED') {
        throw new BadRequestException('La réservation n\'est pas dans un état clôturé/No-Show');
      }

      const now = new Date();
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          statut: 'CHECKED_IN',
          checkinLocataireLe: now,
        },
      });

      await tx.reservationHistorique.create({
        data: {
          reservationId,
          ancienStatut: reservation.statut as StatutReservation,
          nouveauStatut: 'CHECKED_IN',
          modifiePar: userId,
          raison: 'Accueilli tardivement après signalement No-Show',
        },
      });

      return updated;
    });
  }

  /**
   * Rate tenant (owner or manager, reservation must be COMPLETED)
   */
  async rateTenant(userId: string, reservationId: string, note: number, commentaire?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { logement: { select: { gestionnaireId: true } } },
      });

      if (!reservation) {
        throw new NotFoundException('Réservation introuvable');
      }

      const isOwnerOrManager = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;
      if (!isOwnerOrManager) {
        throw new BadRequestException('Seul le propriétaire ou le gestionnaire peut noter le locataire');
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

      // Create rating for tenant (logementId is null because owner rates the tenant, not the listing)
      await tx.avis.create({
        data: {
          reservationId,
          auteurId: userId,
          cibleId: reservation.locataireId,
          logementId: null,
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

      return { proprietaireId: reservation.proprietaireId, logementId: reservation.logementId, note };
    }, { isolationLevel: 'RepeatableRead' });

    // Update owner's average rating outside transaction to avoid deadlocks
    await this.updateUserAverageRating(result.proprietaireId, 'PROPRIETAIRE');
    if (result.logementId) {
      await this.updateLogementAverageRating(result.logementId);
    }

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

  /**
   * Recalculate and update Logement average rating atomically
   */
  private async updateLogementAverageRating(logementId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "Logement"
        WHERE id = ${logementId}
        FOR UPDATE
      `;

      const result = await tx.avis.aggregate({
        where: { logementId, typeAvis: TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO },
        _avg: { note: true },
        _count: { id: true },
      });

      if (!result._count.id || result._count.id === 0) {
        return;
      }

      const average = result._avg.note || 0;
      const count = result._count.id;

      await tx.logement.update({
        where: { id: logementId },
        data: {
          note: new Decimal(average.toFixed(2)),
          totalAvis: count,
        },
      });
    }, { isolationLevel: 'Serializable' });
  }
}
