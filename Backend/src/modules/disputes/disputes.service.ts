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
  TypeFaute,
  TypeTransactionWallet,
  SensTransaction,
} from '@prisma/client';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refundPayment: RefundPaymentUseCase,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Ouvrir un litige
   */
  async create(auteurId: string, dto: CreateDisputeDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { logement: { select: { gestionnaireId: true } } },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation introuvable');
    }

    const isLocataire = reservation.locataireId === auteurId;
    const isProprio = reservation.proprietaireId === auteurId || reservation.logement?.gestionnaireId === auteurId;

    if (!isLocataire && !isProprio) {
      throw new ForbiddenException('Vous n\'êtes pas partie prenante de cette réservation');
    }

    // 1. Validations selon le rôle et le statut
    if (isLocataire) {
      // Le locataire peut ouvrir un litige si CONFIRMED (refus check-in), CHECKED_IN (problème pendant séjour) ou COMPLETED
      const autorise = (([StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] as StatutReservation[]).includes(reservation.statut));
      if (!autorise) {
        throw new UnprocessableEntityException('Litige non autorisé pour ce statut de réservation');
      }
    } else {
      // Le propriétaire ou gestionnaire peut ouvrir un litige si CONFIRMED, CHECKED_IN ou COMPLETED
      const autorise = (([StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.COMPLETED] as StatutReservation[]).includes(reservation.statut));
      if (!autorise) {
        throw new UnprocessableEntityException('Le propriétaire ne peut ouvrir un litige que sur une réservation confirmée, en séjour ou terminée');
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

    // Notification Push à l'autre partie
    const autrePartieId = isLocataire ? reservation.proprietaireId : reservation.locataireId;
    const redirectUrl = isLocataire
      ? `/dashboard/reservations/${dto.reservationId}`
      : `/reservations/${dto.reservationId}`;

    this.notifications.sendDisputePush(
      autrePartieId,
      'Nouveau litige déclaré 🚨',
      'Un litige a été ouvert concernant votre réservation. L\'équipe Klef examine le dossier.',
      redirectUrl
    ).catch((err) => this.logger.error(`Erreur Push litige create: ${err.message}`));

    return result;
  }

  /**
   * Consulter la fiche détaillée d'un litige pour l'admin
   */
  async getDetailsForAdmin(id: string) {
    const litige = await this.prisma.litige.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            locataire: true,
            proprietaire: true,
            logement: true,
            photosEtatLieu: true,
            paiement: true,
            historique: { orderBy: { modifieLe: 'desc' } },
          },
        },
      },
    });

    if (!litige) throw new NotFoundException('Litige introuvable');
    return litige;
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
            photosEtatLieu: true,
            paiement: true,
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
    const totalMontant = Number(reservation.totalLocataire || 0);

    // Calcul du montant de compensation et du taux effectif de remboursement
    let effectiveTaux = 0;
    let calculatedCompensation = 0;

    if (dto.statut === StatutLitige.FONDE && litige.declarePar === RoleLitige.LOCATAIRE) {
      if (['LOGEMENT_NON_CONFORME', 'LOGEMENT_INACCESSIBLE', 'ANNULATION_ABUSIVE_HOTE'].includes(litige.motif)) {
        // Pour logement non conforme ou inaccessible : remboursement 100% automatique et départ du voyageur
        effectiveTaux = 100;
        calculatedCompensation = totalMontant;
      } else if (dto.montantCompensation != null && totalMontant > 0) {
        calculatedCompensation = Math.min(dto.montantCompensation, totalMontant);
        effectiveTaux = Math.round((calculatedCompensation / totalMontant) * 100);
      } else if (dto.tauxRemboursement != null) {
        effectiveTaux = Math.min(Math.max(dto.tauxRemboursement, 0), 100);
        calculatedCompensation = Math.round((totalMontant * effectiveTaux) / 100);
      } else {
        effectiveTaux = 100;
        calculatedCompensation = totalMontant;
      }
    } else if (dto.montantCompensation != null) {
      calculatedCompensation = dto.montantCompensation;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le litige avec le montant de compensation
      const updatedLitige = await tx.litige.update({
        where: { id },
        data: {
          statut: dto.statut,
          decisionAdmin: dto.decisionAdmin,
          montantCompensation: calculatedCompensation > 0 ? calculatedCompensation : null,
          resoluLe: new Date(),
          resoluParAdminId: adminId,
        },
      });

      // 2. Déterminer le statut réel à restaurer pour la réservation
      const is100PercentRefund = (dto.statut === StatutLitige.FONDE && (effectiveTaux >= 100 || litige.motif === 'LOGEMENT_NON_CONFORME' || litige.motif === 'LOGEMENT_INACCESSIBLE'));
      const now = new Date();
      const dateFin = new Date(reservation.dateFin);

      const isCheckinValidated = !!(reservation.checkinLocataireLe || reservation.checkinProprioLe);
      const isCheckoutDone = !!(reservation.checkoutLocataireLe || reservation.checkoutProprioLe);
      const isStayEnded = isCheckoutDone || now >= dateFin;

      let nouveauStatutResa: StatutReservation;
      if (dto.statut === StatutLitige.FONDE && is100PercentRefund) {
        // Remboursement 100% ou non-conformité -> Annulation définitive
        nouveauStatutResa = StatutReservation.CANCELLED;
      } else if (isCheckinValidated) {
        // Si le check-in avait déjà été validé :
        // - Si le séjour est terminé (checkout effectué ou date de fin dépassée) -> COMPLETED
        // - Sinon le séjour est toujours en cours -> CHECKED_IN
        nouveauStatutResa = isStayEnded ? StatutReservation.COMPLETED : StatutReservation.CHECKED_IN;
      } else {
        // Si le check-in N'AVAIT PAS encore été validé :
        // Le litige est levé -> Retour à CONFIRMED pour que le locataire puisse valider son check-in !
        nouveauStatutResa = StatutReservation.CONFIRMED;
      }

      await tx.reservation.update({
        where: { id: litige.reservationId },
        data: { statut: nouveauStatutResa },
      });

      // 3. Si FONDE : Attribution des fautes et compensations
      if (dto.statut === StatutLitige.FONDE) {
        const estLocataireVictime = litige.declarePar === RoleLitige.LOCATAIRE;

        if (estLocataireVictime) {
          // Ajouter une faute au propriétaire
          await tx.compteurFaute.create({
            data: {
              utilisateurId: reservation.proprietaireId,
              type: TypeFaute.NON_CONFORMITE_LOGEMENT,
              reservationId: reservation.id,
              description: `Litige FONDE (${effectiveTaux}% remboursé) [Motif: ${litige.motif}] : ${dto.decisionAdmin}`,
            },
          });
        } else {
          // Proprio victime (ex: dommages ou dépassement personnes)
          const typeFauteLocataire =
            litige.motif === 'DEPASSEMENT_PERSONNES'
              ? TypeFaute.DEPASSEMENT_PERSONNES
              : TypeFaute.NON_CONFORMITE_LOGEMENT;

          await tx.compteurFaute.create({
            data: {
              utilisateurId: reservation.locataireId,
              type: typeFauteLocataire,
              reservationId: reservation.id,
              description: `Litige FONDE [Motif: ${litige.motif}] : ${dto.decisionAdmin}`,
            },
          });

          // Si dédommagement accordé au propriétaire (ex: dégâts)
          if (calculatedCompensation > 0) {
            const hostWallet = await tx.wallet.upsert({
              where: { utilisateurId: reservation.proprietaireId },
              create: {
                utilisateurId: reservation.proprietaireId,
                soldeDisponible: calculatedCompensation,
              },
              update: {
                soldeDisponible: { increment: calculatedCompensation },
              },
            });

            const soldeApres = Number(hostWallet.soldeDisponible);
            await tx.transactionWallet.create({
              data: {
                walletId: hostWallet.id,
                reservationId: reservation.id,
                type: TypeTransactionWallet.CREDIT_LOCATION,
                montant: calculatedCompensation,
                sens: SensTransaction.CREDIT,
                soldeApres,
                description: `Dédommagement litige FONDÉ (${calculatedCompensation.toLocaleString('fr-FR')} FCFA) — résa ${reservation.id.slice(0, 8).toUpperCase()}`,
              },
            });
          }
        }
      }

      this.logger.log(`Litige [${id}] résolu par l'admin [${adminId}] : ${dto.statut} (Taux: ${effectiveTaux}%)`);
      return { updatedLitige, litige };
    });

    // 3. Après la transaction : Initier le remboursement selon le taux calculé
    if (dto.statut === StatutLitige.FONDE && result.litige.declarePar === RoleLitige.LOCATAIRE && effectiveTaux > 0) {
      try {
        await this.refundPayment.execute(result.litige.reservationId, effectiveTaux);
        this.logger.log(`Remboursement de ${effectiveTaux}% (${calculatedCompensation} FCFA) initié pour la réservation ${result.litige.reservationId} suite au litige ${id}`);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Échec du remboursement pour le litige ${id} (réservation ${result.litige.reservationId}): ${err.message}`,
          err.stack
        );
      }
    }

    // Notifications Push aux deux parties
    this.notifications.sendDisputePush(
      reservation.locataireId,
      'Décision sur votre litige ⚖️',
      `Le litige a été rendu ${dto.statut === StatutLitige.FONDE ? 'FONDE' : 'NON FONDE'}. Décision : ${dto.decisionAdmin}`,
      '/reservations'
    ).catch(() => {});

    this.notifications.sendDisputePush(
      reservation.proprietaireId,
      'Décision sur le litige ⚖️',
      `Le litige a été rendu ${dto.statut === StatutLitige.FONDE ? 'FONDE' : 'NON FONDE'}. Décision : ${dto.decisionAdmin}`,
      '/reservations'
    ).catch(() => {});

    return result.updatedLitige;
  }
}
