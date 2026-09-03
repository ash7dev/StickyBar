import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  ResultatAnnulation,
  SensTransaction,
  StatutLogement,
  StatutPaiement,
  StatutReservation,
  StatutKyc,
  TypeTransactionWallet,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AdminListingsQueryDto } from './dto/admin-listings-query.dto';

@Injectable()
export class AdminListingsService {
  private readonly logger = new Logger(AdminListingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async listForReview(dto: AdminListingsQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.LogementWhereInput = {
      ...(dto.statut && { statut: dto.statut }),
      ...(dto.type && { type: dto.type as any }),
      ...(dto.search && {
        OR: [
          { titre: { contains: dto.search, mode: 'insensitive' } },
          { ville: { contains: dto.search, mode: 'insensitive' } },
          { quartier: { contains: dto.search, mode: 'insensitive' } },
          { proprietaire: { prenom: { contains: dto.search, mode: 'insensitive' } } },
          { proprietaire: { nom: { contains: dto.search, mode: 'insensitive' } } },
          { proprietaire: { email: { contains: dto.search, mode: 'insensitive' } } },
        ],
      }),
      archiveLe: null,
    };

    const [total, logements] = await this.prisma.$transaction([
      this.prisma.logement.count({ where }),
      this.prisma.logement.findMany({
        where,
        select: {
          id: true,
          titre: true,
          type: true,
          ville: true,
          prixBase: true,
          acomptePourcentage: true,
          surface: true,
          nombreChambres: true,
          nombreSallesBain: true,
          capaciteMax: true,
          isFeatured: true,
          isInstantBooking: true,
          nbNonConformitesAnnonce: true,
          statut: true,
          rejectionReason: true,
          creeLe: true,
          photos: {
            select: { id: true, url: true, categorie: true, estPrincipale: true },
            orderBy: [{ estPrincipale: 'desc' }, { position: 'asc' }],
            take: 5,
          },
          proprietaire: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              statutKyc: true,
            },
          },
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: logements,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDetailsForAdmin(id: string) {
    const logement = await this.prisma.logement.findUnique({
      where: { id },
      include: {
        photos: { orderBy: [{ estPrincipale: 'desc' }, { position: 'asc' }] },
        equipements: { include: { equipement: true } },
        tarifsPersonnes: { orderBy: { position: 'asc' } },
        tarifsNuits: { orderBy: { position: 'asc' } },
        proprietaire: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            telephone: true,
            statutKyc: true,
            nbAnnulations: true,
            nbAbsencesJourJ: true,
          },
        },
      },
    });

    if (!logement) throw new NotFoundException('Logement introuvable');
    return logement;
  }

  async publish(id: string, adminId: string) {
    const logement = await this.prisma.logement.findUnique({
      where: { id },
      select: {
        statut: true,
        gestionnaireId: true,
        proprietaireId: true,
        proprietaire: { select: { isShadowAccount: true, statutKyc: true } },
      },
    });

    if (!logement) throw new NotFoundException('Logement introuvable');
    if (logement.statut !== StatutLogement.PENDING_REVIEW) {
      throw new UnprocessableEntityException(
        `Seuls les logements en PENDING_REVIEW peuvent être publiés (statut actuel : ${logement.statut})`,
      );
    }

    const updated = await this.prisma.logement.update({
      where: { id },
      data: {
        statut: StatutLogement.PUBLISHED,
        rejectionReason: null,
        valideLe: new Date(),
        valideParAdminId: adminId,
      },
    });

    // Si le bien est sous conciergerie ou appartient à un compte shadow, valider automatiquement le KYC du propriétaire
    if (
      (logement.gestionnaireId || logement.proprietaire?.isShadowAccount) &&
      logement.proprietaireId &&
      logement.proprietaire?.statutKyc !== StatutKyc.VERIFIE
    ) {
      await this.prisma.utilisateur.update({
        where: { id: logement.proprietaireId },
        data: { statutKyc: StatutKyc.VERIFIE },
      });
      this.logger.log(
        `[AdminPublish] KYC du propriétaire shadow ${logement.proprietaireId} passé à VERIFIE sous mandat conciergerie.`,
      );
    }

    await this.invalidateSearchCache();
    return updated;
  }

  async reject(id: string, adminId: string, raison: string | undefined) {
    if (!raison?.trim()) {
      throw new UnprocessableEntityException('La raison est obligatoire pour un rejet');
    }

    const logement = await this.prisma.logement.findUnique({
      where: { id },
      select: { statut: true },
    });

    if (!logement) throw new NotFoundException('Logement introuvable');
    if (logement.statut !== StatutLogement.PENDING_REVIEW) {
      throw new UnprocessableEntityException(
        `Seuls les logements en PENDING_REVIEW peuvent être rejetés (statut actuel : ${logement.statut})`,
      );
    }

    return this.prisma.logement.update({
      where: { id },
      data: {
        statut: StatutLogement.REJECTED,
        rejectionReason: raison,
        valideParAdminId: adminId,
      },
    });
  }

  async suspend(
    id: string,
    adminId: string,
    raison: string | undefined,
  ): Promise<{ suspendus: number; reservationsAnnulees: number }> {
    if (!raison?.trim()) {
      throw new UnprocessableEntityException('La raison est obligatoire pour une suspension');
    }

    const logement = await this.prisma.logement.findUnique({
      where: { id },
      select: { statut: true },
    });

    if (!logement) throw new NotFoundException('Logement introuvable');
    if (logement.statut !== StatutLogement.PUBLISHED) {
      throw new UnprocessableEntityException(
        `Seuls les logements PUBLISHED peuvent être suspendus (statut actuel : ${logement.statut})`,
      );
    }

    const now = new Date();
    let reservationsAnnulees = 0;

    await this.prisma.$transaction(async (tx) => {
      // 1. Suspend logement
      await tx.logement.update({
        where: { id },
        data: {
          statut: StatutLogement.SUSPENDED,
          rejectionReason: raison,
          valideParAdminId: adminId,
        },
      });

      // 2. Find all future CONFIRMED reservations
      const reservations = await tx.reservation.findMany({
        where: {
          logementId: id,
          statut: StatutReservation.CONFIRMED,
          dateDebut: { gt: now },
        },
        select: {
          id: true,
          locataireId: true,
          totalLocataire: true,
          paiement: { select: { id: true } },
        },
      });

      reservationsAnnulees = reservations.length;

      for (const reservation of reservations) {
        // 3a. Cancel reservation
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            statut: StatutReservation.CANCELLED,
            annuleLe: now,
            raisonAnnulation: raison,
            politiqueAppliquee: ResultatAnnulation.ABSENCE_PROPRIO,
          },
        });

        // 3b. Mark paiement REMBOURSE
        if (reservation.paiement) {
          await tx.paiement.update({
            where: { reservationId: reservation.id },
            data: {
              statut: StatutPaiement.REMBOURSE,
              rembourseLe: now,
              montantRembourse: reservation.totalLocataire,
            },
          });
        }

        // 3c. Upsert wallet + credit locataire (100% remboursement)
        const wallet = await tx.wallet.upsert({
          where: { utilisateurId: reservation.locataireId },
          create: {
            utilisateurId: reservation.locataireId,
            soldeDisponible: reservation.totalLocataire,
          },
          update: {
            soldeDisponible: { increment: reservation.totalLocataire },
          },
        });

        // 3d. TransactionWallet — trace du remboursement
        await tx.transactionWallet.create({
          data: {
            walletId: wallet.id,
            reservationId: reservation.id,
            type: TypeTransactionWallet.CREDIT_LOCATION,
            montant: reservation.totalLocataire,
            sens: SensTransaction.CREDIT,
            soldeApres: wallet.soldeDisponible,
            description: `Remboursement intégral — annonce suspendue par l'administrateur`,
          },
        });

        // 3e. Audit trail
        await tx.reservationHistorique.create({
          data: {
            reservationId: reservation.id,
            ancienStatut: StatutReservation.CONFIRMED,
            nouveauStatut: StatutReservation.CANCELLED,
            modifiePar: adminId,
            raison,
            metadonnees: { declencheur: 'SUSPENSION_ANNONCE', logementId: id },
          },
        });
      }
    });

    // 4. Redis cache invalidation (outside DB transaction)
    await this.invalidateSearchCache();

    this.logger.log(
      `Annonce ${id} suspendue par ${adminId} — ${reservationsAnnulees} réservation(s) annulée(s)`,
    );

    return { suspendus: 1, reservationsAnnulees };
  }

  async unsuspend(id: string, adminId: string) {
    const logement = await this.prisma.logement.findUnique({
      where: { id },
      select: { statut: true },
    });

    if (!logement) throw new NotFoundException('Logement introuvable');
    if (logement.statut !== StatutLogement.SUSPENDED) {
      throw new UnprocessableEntityException(
        `Seuls les logements suspendus peuvent être réactivés (statut actuel : ${logement.statut})`,
      );
    }

    const updated = await this.prisma.logement.update({
      where: { id },
      data: {
        statut: StatutLogement.PUBLISHED,
        rejectionReason: null,
        valideParAdminId: adminId,
      },
    });

    await this.invalidateSearchCache();
    return updated;
  }

  async setFeatured(id: string, isFeatured: boolean, durationDays: number = 30) {
    const logement = await this.prisma.logement.findUnique({ where: { id } });
    if (!logement) throw new NotFoundException('Logement introuvable');

    const featuredUntil = isFeatured
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const updated = await this.prisma.logement.update({
      where: { id },
      data: {
        isFeatured,
        featuredUntil,
      },
    });

    await this.invalidateSearchCache();
    return updated;
  }

  private async invalidateSearchCache(): Promise<void> {
    try {
      const keys = await this.redis.getClient().keys('listings:search:*');
      if (keys.length > 0) {
        await this.redis.getClient().del(...keys);
        this.logger.debug(`Cache recherche invalidé : ${keys.length} clé(s) supprimée(s)`);
      }
    } catch (err) {
      this.logger.warn(`Échec invalidation cache recherche : ${(err as Error).message}`);
    }
  }
}
