import { Injectable, Logger } from '@nestjs/common';
import { StatutPaiement, StatutReservation } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const ORPHAN_THRESHOLD_MS = 30 * 60 * 1000; // 30 min

@Injectable()
export class OrphanPaymentUseCase {
  private readonly logger = new Logger(OrphanPaymentUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<void> {
    const threshold = new Date(Date.now() - ORPHAN_THRESHOLD_MS);

    const orphans = await this.prisma.paiement.findMany({
      where: {
        statut: StatutPaiement.EN_ATTENTE,
        creeLe: { lt: threshold },
        reservation: { statut: StatutReservation.PENDING },
      },
      select: {
        id: true,
        reservationId: true,
        montant: true,
      },
    });

    if (!orphans.length) return;

    this.logger.warn(`[OrphanPayment] ${orphans.length} paiement(s) orphelin(s) détecté(s)`);

    for (const paiement of orphans) {
      await this.prisma.$transaction(async (tx) => {
        await tx.paiement.update({
          where: { id: paiement.id },
          data: { statut: StatutPaiement.ECHOUE },
        });

        await tx.reservation.update({
          where: { id: paiement.reservationId },
          data: { statut: StatutReservation.EXPIRED, updatedBySystem: true },
        });

        await tx.reservationHistorique.create({
          data: {
            reservationId: paiement.reservationId,
            ancienStatut: StatutReservation.PENDING,
            nouveauStatut: StatutReservation.EXPIRED,
            modifiePar: 'SYSTEM_ORPHAN_PAYMENT',
            raison: 'Paiement orphelin — aucune confirmation reçue après 30 min',
          },
        });
      });

      this.logger.log(`[OrphanPayment] Paiement ${paiement.id} / Résa ${paiement.reservationId} expirés`);
    }
  }
}
