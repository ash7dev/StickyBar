import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { StatutReservation, CategoriePhotoEtatLieu, TypeEtatLieu } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface AddEtatLieuxPhotoInput {
  type: TypeEtatLieu;
  categorie: CategoriePhotoEtatLieu;
  url: string;
  publicId?: string;
}

@Injectable()
export class AddEtatLieuxPhotoUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(reservationId: string, userId: string, input: AddEtatLieuxPhotoInput) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.proprietaireId !== userId) {
      throw new ForbiddenException("Seul le propriétaire peut ajouter des photos d'état des lieux");
    }

    const allowedStatuts: StatutReservation[] = [StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN];
    if (!allowedStatuts.includes(reservation.statut)) {
      throw new ConflictException(`Action impossible dans le statut actuel: ${reservation.statut}`);
    }

    if (input.type === 'CHECKIN' && reservation.statut !== StatutReservation.CONFIRMED) {
      throw new ConflictException('Les photos de check-in ne peuvent être ajoutées que pour une réservation CONFIRMED');
    }
    if (input.type === 'CHECKOUT' && reservation.statut !== StatutReservation.CHECKED_IN) {
      throw new ConflictException('Les photos de check-out ne peuvent être ajoutées que pour une réservation CHECKED_IN');
    }

    return this.prisma.photoEtatLieu.create({
      data: {
        reservationId,
        type: input.type,
        uploadePar: 'PROPRIO',
        url: input.url,
        publicId: input.publicId ?? null,
        categorie: input.categorie,
      },
    });
  }
}
