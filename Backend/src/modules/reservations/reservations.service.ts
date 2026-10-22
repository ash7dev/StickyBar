import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
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
import { StatutReservation, TypeAvis, RoleLitige, MotifLitige, StatutLitige, TypeTransactionWallet, SensTransaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { traceAction } from '../../domain/reservation/trace';
import { computeExtraGuests } from './extra-guests';

/** Fenêtre pour noter l'autre partie après la clôture (cf. job fermer-fenetre-avis). */
const REVIEW_WINDOW_DAYS = 7;
const EXTRA_GUESTS_TITLE = 'Voyageurs en plus';

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
        // statutKyc : le propriétaire voit si l'identité du voyageur est vérifiée avant de décider
        locataire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true, statutKyc: true } },
        proprietaire: { select: { id: true, prenom: true, nom: true, avatarUrl: true, telephone: true } },
        logement: {
          select: {
            id: true, titre: true, ville: true, quartier: true,
            photos: { take: 1, where: { estPrincipale: true }, select: { url: true } },
          },
        },
        // L'accueil voyageur propose de noter un séjour terminé tant qu'aucun avis n'est laissé
        avis: { select: { auteurId: true } },
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
        demandesFrais: { orderBy: { creeLe: 'desc' } },
        historique: { orderBy: { modifieLe: 'desc' }, take: 50 },
        // Lecture seule pour l'écran de détail : avis déjà laissés et remboursements réels
        avis: { select: { auteurId: true, note: true, commentaire: true, creeLe: true } },
        refunds: {
          orderBy: { creeLe: 'desc' },
          select: { montantLocataire: true, statut: true, motif: true, methodeRemboursement: true, creeLe: true },
        },
      },
    });
  }

  async create(user: AuthUser, dto: CreateReservationDto, idempotencyKey?: string) {
    const res = await this.createUseCase.execute(user, dto as CreateReservationInput, idempotencyKey);
    if (res && res.reservationId) {
      const fullRes = await this.prisma.reservation.findUnique({
        where: { id: res.reservationId },
        select: { id: true, proprietaireId: true, locataireId: true, logement: { select: { titre: true } } },
      });
      if (fullRes) {
        // 1. Notification Push à l'Hôte
        this.notifications.sendReservationPush(
          fullRes.proprietaireId,
          'Nouvelle réservation reçue 📅',
          `Un voyageur a réservé "${fullRes.logement?.titre || 'votre logement'}". Cliquez pour consulter les détails.`,
          `/reservations?id=${fullRes.id}`
        ).catch(() => {});

        // 2. Notification Push au Voyageur
        this.notifications.sendReservationPush(
          fullRes.locataireId,
          'Réservation enregistrée 🎉',
          `Votre demande de réservation pour "${fullRes.logement?.titre || 'le logement'}" est enregistrée !`,
          `/reservations?id=${fullRes.id}`
        ).catch(() => {});
      }
    }
    return res;
  }

  async confirm(id: string, userId: string, heureDebut?: string, heureFin?: string) {
    const res = await this.confirmUseCase.execute(id, userId, heureDebut, heureFin);
    if (res && res.locataireId) {
      this.notifications.sendReservationPush(
        res.locataireId,
        'Réservation confirmée par l\'hôte 👍',
        `Votre hôte a validé les détails de votre arrivée.`,
        `/reservations?id=${id}`
      ).catch(() => {});
    }
    return res;
  }

  async cancel(id: string, userId: string, raison: string) {
    const fullResBefore = await this.prisma.reservation.findUnique({
      where: { id },
      select: { id: true, proprietaireId: true, locataireId: true },
    });

    const res = await this.cancelUseCase.execute(id, userId, raison);

    if (fullResBefore) {
      const isLocataire = fullResBefore.locataireId === userId;
      const targetUserId = isLocataire ? fullResBefore.proprietaireId : fullResBefore.locataireId;
      if (targetUserId) {
        this.notifications.sendReservationPush(
          targetUserId,
          'Annulation de réservation ⚠️',
          `La réservation pour votre séjour a été annulée : ${raison || 'Aucune raison spécifiée.'}`,
          `/reservations?id=${id}`
        ).catch(() => {});
      }
    }
    return res;
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
          // Le code système reste (détection du no-show) ; l'auteur réel est gardé pour la traçabilité
          metadonnees: { actorId: userId },
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

      if (reservation.closeLe && Date.now() > reservation.closeLe.getTime() + REVIEW_WINDOW_DAYS * 86_400_000) {
        throw new BadRequestException(`Le délai de ${REVIEW_WINDOW_DAYS} jours pour laisser un avis est dépassé`);
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
        closeLe: Date | null;
      }>>`
        SELECT id, "proprietaireId", "locataireId", "logementId", statut, "closeLe"
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

      if (reservation.closeLe && Date.now() > reservation.closeLe.getTime() + REVIEW_WINDOW_DAYS * 86_400_000) {
        throw new BadRequestException(`Le délai de ${REVIEW_WINDOW_DAYS} jours pour laisser un avis est dépassé`);
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

  // ── SUPPLÉMENT « VOYAGEURS EN PLUS » ─────────────────────────────────────────
  // Seul supplément possible : l'hôte déclare le nombre réel de voyageurs, le serveur
  // calcule le montant avec la grille du logement. Réglé en espèces sur place ;
  // le voyageur peut contester (litige arbitré par Paixi). Les dégâts passent par un litige.

  private async loadForExtraGuests(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        logement: {
          select: {
            gestionnaireId: true,
            capaciteMax: true,
            personnesBase: true,
            tarifsPersonnes: { select: { personnesMin: true, personnesMax: true, supplement: true } },
          },
        },
        demandesFrais: { select: { statut: true } },
      },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.proprietaireId !== userId && reservation.logement?.gestionnaireId !== userId) {
      throw new ForbiddenException('Seul l’hôte peut déclarer des voyageurs en plus');
    }
    return reservation;
  }

  async estimateExtraGuests(reservationId: string, userId: string, nbVoyageurs: number) {
    const reservation = await this.loadForExtraGuests(reservationId, userId);
    return computeExtraGuests(reservation, nbVoyageurs);
  }

  async createDemandeFrais(reservationId: string, userId: string, nbVoyageurs: number) {
    const reservation = await this.loadForExtraGuests(reservationId, userId);
    const calc = computeExtraGuests(reservation, nbVoyageurs);
    const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`;

    const demande = await this.prisma.demandeFrais.create({
      data: {
        reservationId,
        titre: EXTRA_GUESTS_TITLE,
        description: `${calc.prevus} → ${calc.nbVoyageurs} voyageurs · ${plural(calc.nuits, 'nuit')} × ${calc.parNuit.toLocaleString('fr-FR')} FCFA`,
        montant: calc.montant,
        statut: 'EN_ATTENTE',
      },
    });
    await traceAction(this.prisma, {
      reservationId,
      statut: reservation.statut,
      actorId: userId,
      action: 'SUPPLEMENT_DECLARE',
      meta: { montant: calc.montant, voyageurs: calc.nbVoyageurs },
    });

    this.notifications.sendReservationPush(
      reservation.locataireId,
      'Supplément voyageurs en plus',
      `Votre hôte déclare ${calc.nbVoyageurs} voyageurs au lieu de ${calc.prevus} : ${calc.montant.toLocaleString('fr-FR')} FCFA à régler sur place, ou à contester.`,
      `/reservation/${reservationId}`,
    ).catch(() => {});

    return demande;
  }

  async getDemandesFrais(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        OR: [{ locataireId: userId }, { proprietaireId: userId }, { logement: { gestionnaireId: userId } }],
      },
      select: { id: true },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    return this.prisma.demandeFrais.findMany({
      where: { reservationId },
      orderBy: { creeLe: 'desc' },
    });
  }

  /**
   * Paiement en ligne d'un supplément : désactivé tant qu'il n'est pas branché sur
   * un vrai encaissement Wave / Orange Money. Avant, cet appel créditait le wallet
   * de l'hôte sans qu'aucun argent ne soit reçu.
   */
  async payerDemandeFrais(_reservationId: string, _fraisId: string, _userId: string, _methodePaiement?: string): Promise<never> {
    throw new BadRequestException('Le supplément se règle en espèces auprès de votre hôte. Vous pouvez aussi le contester.');
  }

  /** Contestation par le voyageur : ouvre (ou rejoint) le litige du séjour. */
  async refuserDemandeFrais(reservationId: string, fraisId: string, userId: string, raison?: string) {
    const demande = await this.prisma.demandeFrais.findUnique({
      where: { id: fraisId },
      include: { reservation: true },
    });

    if (!demande || demande.reservationId !== reservationId) {
      throw new NotFoundException('Demande de frais introuvable');
    }
    if (demande.reservation.locataireId !== userId) {
      throw new ForbiddenException('Seul le voyageur peut contester un supplément');
    }
    if (demande.statut !== 'EN_ATTENTE') {
      throw new ConflictException('Ce supplément a déjà été traité');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const contested = await tx.demandeFrais.update({
        where: { id: fraisId },
        data: { statut: 'CONTESTE', refuseLe: new Date() },
      });
      await traceAction(tx, {
        reservationId,
        statut: demande.reservation.statut,
        actorId: userId,
        action: 'SUPPLEMENT_CONTESTE',
        meta: { montant: Number(demande.montant) },
      });

      const existingLitige = await tx.litige.findUnique({ where: { reservationId } });
      if (!existingLitige) {
        await tx.litige.create({
          data: {
            reservationId,
            declarePar: RoleLitige.LOCATAIRE,
            motif: MotifLitige.DEPASSEMENT_PERSONNES,
            description: `Contestation du supplément « ${demande.titre} » de ${Number(demande.montant).toLocaleString('fr-FR')} FCFA (${demande.description ?? ''}). ${raison ?? ''}`.trim(),
            coutEstime: demande.montant,
            statut: StatutLitige.EN_ATTENTE,
          },
        });
        await tx.reservation.update({
          where: { id: reservationId },
          data: { statut: StatutReservation.DISPUTED },
        });
      }
      return contested;
    });

    this.notifications.sendReservationPush(
      demande.reservation.proprietaireId,
      'Supplément contesté',
      `Le voyageur conteste le supplément de ${Number(demande.montant).toLocaleString('fr-FR')} FCFA. L’équipe Paixi examine le dossier.`,
      `/(owner)/reservations/${reservationId}`,
    ).catch(() => {});

    return updated;
  }

  async payerDemandeFraisLiquide(reservationId: string, fraisId: string, userId: string) {
    const demande = await this.prisma.demandeFrais.findUnique({
      where: { id: fraisId },
      include: { reservation: { include: { logement: true } } },
    });

    if (!demande || demande.reservationId !== reservationId) {
      throw new NotFoundException('Demande de frais introuvable');
    }

    const isProprio =
      demande.reservation.proprietaireId === userId ||
      demande.reservation.logement?.gestionnaireId === userId;

    if (!isProprio) {
      throw new ForbiddenException('Seul l\'hôte ou le gestionnaire peut valider un règlement en espèces');
    }

    if (demande.statut !== 'EN_ATTENTE') {
      throw new ConflictException('Ce supplément a déjà été traité');
    }

    // Marquer PAYÉ avec méthode de paiement 'ESPECES' (sans toucher au solde du wallet)
    const updated = await this.prisma.demandeFrais.update({
      where: { id: fraisId },
      data: {
        statut: 'PAYE',
        payeLe: new Date(),
        methodePaiement: 'ESPECES',
      },
    });
    await traceAction(this.prisma, {
      reservationId,
      statut: demande.reservation.statut,
      actorId: userId,
      action: 'SUPPLEMENT_ENCAISSE',
      meta: { montant: Number(demande.montant) },
    });

    this.notifications.sendReservationPush(
      demande.reservation.locataireId,
      'Supplément réglé',
      `Votre hôte confirme avoir reçu ${Number(demande.montant).toLocaleString('fr-FR')} FCFA en espèces.`,
      `/reservation/${reservationId}`,
    ).catch(() => {});

    return updated;
  }
}
