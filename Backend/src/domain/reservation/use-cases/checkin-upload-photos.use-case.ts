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

@Injectable()
export class CheckInUploadPhotosUseCase {
  private readonly logger = new Logger(CheckInUploadPhotosUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

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

    return await this.prisma.$transaction(async (tx) => {
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
        data: { checkinProprioLe: new Date() },
      });
    });
  }
}
