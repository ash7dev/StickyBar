import { 
  ConflictException, 
  ForbiddenException, 
  Injectable, 
  Logger, 
  NotFoundException, 
  UnprocessableEntityException 
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { StatutReservation, TypeAvis } from '@prisma/client';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un avis après un séjour
   */
  async create(auteurId: string, dto: CreateReviewDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { logement: true },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation introuvable');
    }

    // 1. Vérifier le statut COMPLETED
    if (reservation.statut !== StatutReservation.COMPLETED) {
      throw new UnprocessableEntityException('Seules les réservations terminées peuvent être notées');
    }

    // 2. Vérifier si l'auteur est autorisé (Locataire ou Proprio)
    const isLocataire = reservation.locataireId === auteurId;
    const isProprio = reservation.proprietaireId === auteurId;

    if (!isLocataire && !isProprio) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à noter cette réservation');
    }

    // 3. Vérifier la fenêtre d'avis (2 jours après closeLe)
    if (reservation.closeLe) {
      const now = new Date();
      const expirationDate = new Date(reservation.closeLe);
      expirationDate.setDate(expirationDate.getDate() + 2);

      if (now > expirationDate) {
        throw new UnprocessableEntityException('La fenêtre pour laisser un avis est expirée (2 jours maximum)');
      }
    }

    // 4. Déterminer la cible et le type d'avis
    const cibleId = isLocataire ? reservation.proprietaireId : reservation.locataireId;
    const typeAvis = isLocataire 
      ? TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO 
      : TypeAvis.PROPRIO_NOTE_LOCATAIRE;

    // 5. Créer l'avis (le @@unique assure un seul avis par personne par résa)
    try {
      const review = await this.prisma.avis.create({
        data: {
          reservationId: dto.reservationId,
          auteurId,
          cibleId,
          logementId: isLocataire ? reservation.logementId : null,
          note: dto.note,
          commentaire: dto.commentaire,
          typeAvis,
        },
      });

      // 6. Recalcul synchrone des notes
      await this.updateAverageRatings(cibleId, isLocataire ? reservation.logementId : null, typeAvis);

      this.logger.log(`Avis créé [${review.id}] par [${auteurId}] pour [${cibleId}]`);
      return review;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Vous avez déjà laissé un avis pour cette réservation');
      }
      throw error;
    }
  }

  /**
   * Recalcul synchrone des moyennes de notes
   */
  private async updateAverageRatings(cibleId: string, logementId: string | null, typeAvis: TypeAvis) {
    // A. Mise à jour de la note de l'utilisateur (Cible)
    const userReviews = await this.prisma.avis.aggregate({
      where: { 
        cibleId,
        typeAvis: typeAvis // On filtre par le même type pour recalculer la bonne catégorie (hôte ou locataire)
      },
      _avg: { note: true },
      _count: { note: true },
    });

    const newAvg = userReviews._avg.note || 0;
    const totalAvis = userReviews._count.note || 0;

    if (typeAvis === TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO) {
      // Le locataire a noté le PROPRIO
      await this.prisma.utilisateur.update({
        where: { id: cibleId },
        data: { 
          noteProprietaire: newAvg,
          totalAvis: { increment: 1 } // Note: totalAvis global de l'user
        },
      });

      // B. Mise à jour de la note du LOGEMENT
      if (logementId) {
        const logementReviews = await this.prisma.avis.aggregate({
          where: { logementId },
          _avg: { note: true },
          _count: { note: true },
        });

        await this.prisma.logement.update({
          where: { id: logementId },
          data: { 
            note: logementReviews._avg.note || 0,
            totalAvis: logementReviews._count.note || 0,
          },
        });
      }
    } else {
      // Le proprio a noté le LOCATAIRE
      await this.prisma.utilisateur.update({
        where: { id: cibleId },
        data: { 
          noteLocataire: newAvg,
          totalAvis: { increment: 1 }
        },
      });
    }
  }
}
