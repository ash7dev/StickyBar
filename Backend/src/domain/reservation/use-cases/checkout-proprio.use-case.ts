import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class CheckoutProprioUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { photosEtatLieu: { where: { type: 'CHECKOUT' } } },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.proprietaireId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut confirmer le check-out');
    }
    if (reservation.statut !== StatutReservation.CHECKED_IN) {
      throw new ConflictException(`Action impossible dans le statut actuel: ${reservation.statut}`);
    }
    if (reservation.photosEtatLieu.length === 0) {
      throw new ConflictException("Aucune photo de check-out — uploadez au moins une photo avant de confirmer");
    }

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { checkoutProprioLe: new Date() },
    });
  }
}
