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
export class CheckOutUploadPhotosUseCase {
  private readonly logger = new Logger(CheckOutUploadPhotosUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(reservationId: string, userId: string, photos: string[]) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');

    if (reservation.proprietaireId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut uploader les photos de check-out');
    }

    if (reservation.statut !== StatutReservation.CHECKED_IN) {
      throw new ConflictException(`Action impossible dans le statut actuel: ${reservation.statut}`);
    }

    if (photos.length === 0) {
      throw new BadRequestException('Au moins une photo de sortie est requise');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Nettoyer anciennes photos de checkout
      await tx.photoEtatLieu.deleteMany({
        where: { reservationId, type: 'CHECKOUT' },
      });

      // 2. Créer nouvelles entrées
      await tx.photoEtatLieu.createMany({
        data: photos.map((url, index) => ({
          reservationId,
          url,
          type: 'CHECKOUT',
          uploadePar: 'PROPRIO',
          categorie: 'AUTRE',
          position: index,
        })),
      });

      // 3. Update horodatage
      return await tx.reservation.update({
        where: { id: reservationId },
        data: {
          checkoutProprioLe: new Date(),
        },
      });
    });
  }
}
