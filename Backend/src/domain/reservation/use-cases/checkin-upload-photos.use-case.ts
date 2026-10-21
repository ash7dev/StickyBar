import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';

@Injectable()
export class CheckInUploadPhotosUseCase {
  private readonly logger = new Logger(CheckInUploadPhotosUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async execute(reservationId: string, userId: string, photos: string[]) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { logement: { select: { gestionnaireId: true } } },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    const isOwnerOrManager = reservation.proprietaireId === userId || reservation.logement?.gestionnaireId === userId;
    if (!isOwnerOrManager) {
      throw new ForbiddenException('Seul le propriétaire ou le gestionnaire peut uploader les photos de check-in');
    }
    if (reservation.statut !== StatutReservation.CONFIRMED) {
      throw new ConflictException(`Le check-in n'est possible que pour les réservations CONFIRMED (statut actuel: ${reservation.statut})`);
    }
    if (!photos || photos.length === 0) {
      throw new BadRequestException('Au moins une photo de l\'état des lieux est requise');
    }
    // Même garde que checkin-proprio : pas d'état des lieux plus de 4h avant l'arrivée
    if (Date.now() < reservation.dateDebut.getTime() - 4 * 60 * 60 * 1000) {
      throw new ConflictException("L'état des lieux d'entrée ne peut être fait que 4h avant l'arrivée du locataire");
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.photoEtatLieu.deleteMany({ where: { reservationId, type: 'CHECKIN' } });
      await tx.photoEtatLieu.createMany({
        data: photos.map((url, index) => ({
          reservationId,
          url,
          type: 'CHECKIN',
          uploadePar: 'PROPRIO',
          categorie: 'AUTRE',
          position: index,
        })),
      });

      return tx.reservation.update({
        where: { id: reservationId },
        data: { checkinProprioLe: now },
      });
    });

    // État des lieux après l'heure d'arrivée : le voyageur garde 6h pour valider
    if (now > reservation.dateDebut) await this.queue.scheduleLateAutoCheckin(reservationId, now);
    return updated;
  }
}
