import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { StatutLogement, StatutKyc, StatutReservation, StatutPaiement, FournisseurPaiement } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PricingService } from '../../../shared/pricing/pricing.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { AuthUser } from '../../../shared/types/jwt-payload.type';
import { ContratService } from '../../../infrastructure/contrat/contrat.service';

export interface CreateReservationInput {
  logementId: string;
  dateDebut: Date;
  dateFin: Date;
  nbPersonnes: number;
  fournisseur?: FournisseurPaiement;
}

@Injectable()
export class CreateReservationUseCase {
  private readonly logger = new Logger(CreateReservationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly queue: QueueService,
    private readonly contrat: ContratService,
  ) {}

  async execute(user: AuthUser, input: CreateReservationInput, idempotencyKey?: string) {
    const { logementId, dateDebut, dateFin, nbPersonnes, fournisseur = FournisseurPaiement.WAVE } = input;

    // 1. Idempotence
    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      });
      if (existing) {
        this.logger.log(`Idempotence: clé ${idempotencyKey} déjà traitée`);
        return { reservationId: existing.reservationId, paymentUrl: existing.paymentUrl, alreadyProcessed: true };
      }
    }

    // 2. Validation utilisateur
    const locataire = await this.prisma.utilisateur.findUnique({
      where: { id: user.id },
      select: { statutKyc: true, dateNaissance: true },
    });
    if (!locataire) throw new NotFoundException('Utilisateur introuvable');
    if (locataire.statutKyc === StatutKyc.REJETE || locataire.statutKyc === StatutKyc.SUSPENDU) {
      throw new ForbiddenException('Votre compte ne vous permet pas d\'effectuer de réservation (KYC non valide)');
    }

    if (!locataire.dateNaissance) {
      throw new BadRequestException('Veuillez renseigner votre date de naissance dans votre profil pour effectuer une réservation');
    }

    const today = new Date();
    const birthDate = new Date(locataire.dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // 3. Validation dates
    if (dateDebut >= dateFin) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }

    // 4. Calcul prix AVANT la transaction (lecture seule, libère la TX plus tôt)
    const breakdown = await this.pricing.calculateForLogement(logementId, { dateDebut, dateFin, nbPersonnes });

    // 5. Transaction atomique (verrouillage + création réservation uniquement — pas d'appels externes)
    const { reservation, delaiConfirmation } = await this.prisma.$transaction(async (tx) => {
      const [logement] = await tx.$queryRaw<any[]>`
        SELECT * FROM "Logement" WHERE id = ${logementId} FOR UPDATE
      `;

      if (!logement) throw new NotFoundException('Logement introuvable');
      if (logement.statut !== StatutLogement.PUBLISHED) {
        throw new UnprocessableEntityException('Ce logement n\'est pas disponible à la location');
      }

      const ageRequis = logement.ageMin || 18;
      if (age < ageRequis) {
        throw new ForbiddenException(`Ce logement exige un âge minimum de ${ageRequis} ans pour réserver (votre âge : ${age} ans)`);
      }

      if (nbPersonnes > logement.capaciteMax) {
        throw new UnprocessableEntityException(`Capacité maximale : ${logement.capaciteMax} personnes`);
      }

      const nbNuits = Math.round((dateFin.getTime() - dateDebut.getTime()) / 86_400_000);
      if (nbNuits < logement.nuitesMinimum) {
        throw new UnprocessableEntityException(`Séjour minimum : ${logement.nuitesMinimum} nuits`);
      }

      // Vérification disponibilité avec verrouillage pour éviter la race condition
      // Utilise FOR UPDATE pour verrouiller toutes les réservations actives de ce logement
      const activeReservations = await tx.$queryRaw<any[]>`
        SELECT * FROM "Reservation"
        WHERE "logementId" = ${logementId}
        AND statut IN ('PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN')
        FOR UPDATE
      `;

      // Vérification manuelle du chevauchement après verrouillage
      const overlap = activeReservations.find(r => {
        const rDebut = new Date(r.dateDebut);
        const rFin = new Date(r.dateFin);
        return rDebut < dateFin && rFin > dateDebut;
      });
      if (overlap) throw new ConflictException('Le logement est déjà réservé sur ces dates');

      const indispo = await tx.indisponibiliteLogement.findFirst({
        where: { logementId, dateDebut: { lt: dateFin }, dateFin: { gt: dateDebut } },
      });
      if (indispo) throw new ConflictException('Le logement est indisponible sur ces dates');

      // Délai de confirmation propriétaire — toujours avant dateDebut
      const now = new Date();
      const MS_48H = 48 * 3_600_000;
      const MS_2H  =  2 * 3_600_000;
      const MS_30MIN = 30 * 60_000;
      const diffMs = dateDebut.getTime() - now.getTime();

      let delaiMs: number;
      if (diffMs >= MS_48H) {
        delaiMs = MS_48H;        // Réservation future : 48h standard
      } else if (diffMs >= MS_2H) {
        delaiMs = diffMs - MS_2H; // Proprio doit confirmer au moins 2h avant le check-in
      } else {
        delaiMs = MS_30MIN;       // Réservation urgente (< 2h) : 30min, sans pénalité si non confirmé
      }
      const delaiConfirmation = new Date(now.getTime() + delaiMs);

      const reservation = await tx.reservation.create({
        data: {
          logementId,
          locataireId: user.id,
          proprietaireId: logement.proprietaireId,
          dateDebut,
          dateFin,
          nbNuits,
          nbPersonnes,
          prixBase: breakdown.prixBase,
          supplementPersonnes: breakdown.supplementPersonnes,
          prixNuitEffectif: breakdown.prixNuitEffectif,
          reductionNuits: breakdown.reductionNuits,
          totalBase: breakdown.totalBase,
          tauxCommission: breakdown.tauxCommission,
          montantCommission: breakdown.montantCommission,
          totalLocataire: breakdown.totalLocataire,
          netProprietaire: breakdown.netProprietaire,
          statut: StatutReservation.PAID,
          delaiConfirmation,
        },
      });

      await tx.reservationHistorique.createMany({
        data: [
          {
            reservationId: reservation.id,
            nouveauStatut: StatutReservation.PENDING,
            modifiePar: user.id,
            raison: 'Création de la réservation par le locataire',
          },
          {
            reservationId: reservation.id,
            ancienStatut: StatutReservation.PENDING,
            nouveauStatut: StatutReservation.PAID,
            modifiePar: user.id,
            raison: 'Paiement confirmé automatiquement (simulation)',
          },
        ],
      });

      return { reservation, delaiConfirmation };
    }, { isolationLevel: 'RepeatableRead' });

    // 6. Jobs BullMQ — après la TX, connexion DB libérée
    await this.queue.scheduleConfirmationExpiry(reservation.id, delaiConfirmation);

    // Génération du contrat PDF mockée de manière asynchrone (non bloquante)
    this.contrat.generateContract(reservation.id).catch((err) => {
      this.logger.error(`Erreur lors de la génération du contrat pour la résa ${reservation.id} : ${err.message}`);
    });

    // 7. Paiement + idempotence (simulation — pas d'appel externe)
    await this.prisma.$transaction(async (tx) => {
      await tx.paiement.create({
        data: {
          reservationId: reservation.id,
          montant: breakdown.totalLocataire,
          fournisseur,
          statut: StatutPaiement.CONFIRME,
        },
      });

      if (idempotencyKey) {
        await tx.idempotencyKey.create({
          data: {
            key: idempotencyKey,
            reservationId: reservation.id,
            paymentUrl: null,
            expiresAt: new Date(Date.now() + 86_400_000),
          },
        });
      }
    });

    this.logger.log(`Réservation [${reservation.id}] créée — paiement simulé confirmé`);
    return { reservationId: reservation.id, paymentUrl: null };
  }
}
