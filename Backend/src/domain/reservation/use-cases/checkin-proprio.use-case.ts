import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class CheckinProprioUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(reservationId: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { photosEtatLieu: { where: { type: 'CHECKIN' } } },
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.proprietaireId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut confirmer le check-in');
    }
    if (reservation.statut !== StatutReservation.CONFIRMED) {
      throw new ConflictException(`Action impossible dans le statut actuel: ${reservation.statut}`);
    }
    if (reservation.photosEtatLieu.length === 0) {
      throw new ConflictException("Aucune photo d'état des lieux — uploadez au moins une photo avant de confirmer");
    }

    // Garde temporelle : l'état des lieux d'entrée n'est autorisé qu'à partir
    // de 4h avant dateDebut pour empêcher un propriétaire de confirmer le
    // check-in prématurément afin de déclencher le versement des fonds.
    const checkinWindowStart = new Date(reservation.dateDebut);
    checkinWindowStart.setHours(checkinWindowStart.getHours() - 4);
    if (new Date() < checkinWindowStart) {
      throw new ConflictException(
        "L'état des lieux d'entrée ne peut être confirmé que 4h avant l'arrivée du locataire",
      );
    }

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { checkinProprioLe: new Date() },
    });
  }
}
