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
  StatutRetrait,
  ResultatAnnulation,
} from '@prisma/client';
import { RefundPaymentUseCase } from '../../domain/payment/use-cases/refund-payment.use-case';
import { NotificationsService } from '../notifications/notifications.service';
import { paidOf } from '../../domain/payment/refund-plan';

/** Titre des suppléments créés par une décision d'arbitrage : ils ne peuvent pas être contestés à nouveau. */
export const ARBITRAGE_PREFIX = 'Dédommagement décidé par Paixi';

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

      // Suspension conservatoire des demandes de retrait EN_ATTENTE du propriétaire
      const hostId = reservation.proprietaireId;
      const hostWallet = await tx.wallet.findUnique({
        where: { utilisateurId: hostId },
        include: {
          retraits: {
            where: { statut: StatutRetrait.EN_ATTENTE },
          },
        },
      });

      if (hostWallet && hostWallet.retraits.length > 0) {
        for (const r of hostWallet.retraits) {
          await tx.retrait.update({
            where: { id: r.id },
            data: { statut: StatutRetrait.SUSPENDU_POUR_LITIGE },
          });
          this.logger.log(`Retrait [${r.id}] suspendu conservatoirement suite à l'ouverture du litige sur la réservation [${dto.reservationId}]`);
        }
      }

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
      'Un litige a été ouvert concernant votre réservation. L\'équipe Paixi examine le dossier.',
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
    // Toujours sur ce que le locataire a réellement payé (acompte ou totalité, argent et coins)
    const totalMontant = paidOf(reservation).total;

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

      // Le check-in n'est validé QUE si le locataire a confirmé son arrivée (checkinLocataireLe !== null)
      const isCheckinValidated = !!reservation.checkinLocataireLe;
      const isCheckoutDone = !!(reservation.checkoutLocataireLe || reservation.checkoutProprioLe);
      const isStayEnded = isCheckoutDone || now >= dateFin;

      let nouveauStatutResa: StatutReservation;
      if (dto.statut === StatutLitige.FONDE && is100PercentRefund) {
        // Remboursement 100% ou non-conformité -> Annulation définitive
        nouveauStatutResa = StatutReservation.CANCELLED;
      } else if (isCheckinValidated) {
        // Si le locataire AVAIT DÉJÀ validé son check-in :
        // - Si le séjour est terminé (checkout effectué ou date de fin dépassée) -> COMPLETED
        // - Sinon le séjour est toujours en cours -> CHECKED_IN
        nouveauStatutResa = isStayEnded ? StatutReservation.COMPLETED : StatutReservation.CHECKED_IN;
      } else {
        // Si le locataire N'AVAIT PAS encore validé son check-in :
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

          // Remboursement (argent sur le portefeuille, coins en coins) et, si l'hôte avait déjà été payé,
          // reprise de sa part au prorata + frais Paixi rendus
          if (calculatedCompensation > 0) {
            const refund = await this.refundPayment.refundAnyStageInTx(tx, reservation.id, {
              montant: calculatedCompensation,
              motif: ResultatAnnulation.NON_CONFORMITE_LOGEMENT,
              declenchePar: adminId,
              cloture: nouveauStatutResa === StatutReservation.CANCELLED,
            });
            this.logger.log(
              `Litige [${id}] : ${refund.cash} FCFA + ${refund.coins} coins rendus au locataire, ` +
              `reprise hôte ${refund.repriseHote} FCFA, frais Paixi rendus ${refund.repriseFraisPaixi} FCFA`,
            );
          }
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

          // Dédommagement accordé à l'hôte (ex : dégâts) : c'est le locataire qui le doit.
          // Il apparaît comme un supplément, réglé auprès de l'hôte ; plus aucun argent créé à partir de rien.
          if (calculatedCompensation > 0) {
            await tx.demandeFrais.create({
              data: {
                reservationId: reservation.id,
                titre: `${ARBITRAGE_PREFIX} (${litige.motif})`,
                description: dto.decisionAdmin || 'Montant décidé par l\'arbitrage Paixi',
                montant: calculatedCompensation,
                statut: 'EN_ATTENTE',
              },
            });
          }
        }
      }

      // 4. Vérifier s'il reste d'autres litiges EN_ATTENTE pour le propriétaire
      const remainingLitiges = await tx.litige.count({
        where: {
          statut: StatutLitige.EN_ATTENTE,
          id: { not: id },
          reservation: { proprietaireId: reservation.proprietaireId },
        },
      });

      // S'il n'y a plus aucun litige actif, rétablir les retraits suspendus
      if (remainingLitiges === 0) {
        const suspendedRetraits = await tx.retrait.findMany({
          where: {
            wallet: { utilisateurId: reservation.proprietaireId },
            statut: StatutRetrait.SUSPENDU_POUR_LITIGE,
          },
        });

        for (const r of suspendedRetraits) {
          await tx.retrait.update({
            where: { id: r.id },
            data: { statut: StatutRetrait.EN_ATTENTE },
          });
          this.logger.log(`Retrait [${r.id}] rétabli en statut EN_ATTENTE après résolution de tous les litiges`);
        }
      }

      this.logger.log(`Litige [${id}] résolu par l'admin [${adminId}] : ${dto.statut} (Taux: ${effectiveTaux}%)`);
      return { updatedLitige, litige };
    });

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
