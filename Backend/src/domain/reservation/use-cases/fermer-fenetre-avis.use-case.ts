import { Injectable, Logger } from '@nestjs/common';
import { StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';

@Injectable()
export class FermerFenetreAvisUseCase {
  private readonly logger = new Logger(FermerFenetreAvisUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async execute(reservationId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        logement: { select: { titre: true } },
        avis: { select: { auteurId: true } },
      },
    });

    if (!reservation || reservation.statut !== StatutReservation.COMPLETED) {
      this.logger.warn(`[FermerFenetreAvis] Résa ${reservationId} introuvable ou non COMPLETED`);
      return;
    }

    const authorIds = new Set(reservation.avis.map((a) => a.auteurId));
    const logementTitre = reservation.logement.titre;
    const dateDebut = reservation.dateDebut.toLocaleDateString('fr-FR');

    // Rappel CHECKOUT_VALIDE utilisé comme proxy pour le rappel d'avis
    const toNotify: string[] = [];
    if (!authorIds.has(reservation.locataireId))   toNotify.push(reservation.locataireId);
    if (!authorIds.has(reservation.proprietaireId)) toNotify.push(reservation.proprietaireId);

    await Promise.all(
      toNotify.map((userId) =>
        this.queue.enqueueNotification(userId, 'CHECKOUT_VALIDE', {
          logementTitre,
          dateDebut,
          reservationId,
        }),
      ),
    );

    this.logger.log(
      `[FermerFenetreAvis] Fenêtre fermée pour ${reservationId} — ${toNotify.length} rappel(s) d'avis envoyé(s)`,
    );
  }
}
