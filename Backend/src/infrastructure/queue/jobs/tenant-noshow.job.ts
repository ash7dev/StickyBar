import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { ResultatAnnulation } from '@prisma/client';

@Processor('reservation-jobs')
export class TenantNoshowJob {
  private readonly logger = new Logger(TenantNoshowJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('tenant-noshow')
  async handle(job: Job) {
    this.logger.log('[tenant-noshow] Scan des réservations No-Show locataire...');

    const now = new Date();
    // Rechercher les réservations dont l'absence locataire a été signalée par l'hôte et expirées (> 15 min après alerte)
    const pendingNoshows = await this.prisma.reservationHistorique.findMany({
      where: {
        modifiePar: 'OWNER_SIGNAL_TENANT_NOSHOW',
        modifieLe: { lte: new Date(now.getTime() - 15 * 60 * 1000) },
      },
      include: {
        reservation: true,
      },
    });

    for (const item of pendingNoshows) {
      const res = item.reservation;
      if (res && res.statut === 'CONFIRMED' && !res.checkinLocataireLe) {
        this.logger.log(`[tenant-noshow] Validation No-Show définitive pour réservation ${res.id}`);
        await this.prisma.$transaction(async (tx) => {
          await tx.reservation.update({
            where: { id: res.id },
            data: {
              statut: 'COMPLETED',
              closeLe: now,
              politiqueAppliquee: ResultatAnnulation.NO_SHOW_LOCATAIRE,
            },
          });

          await tx.reservationHistorique.create({
            data: {
              reservationId: res.id,
              ancienStatut: 'CONFIRMED',
              nouveauStatut: 'COMPLETED',
              modifiePar: 'SYSTEM_CRON_NOSHOW',
              raison: 'Clôture automatique No-Show locataire (Fonds conservés par l\'hôte)',
            },
          });
        });
      }
    }
  }
}
