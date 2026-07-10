import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CronJobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CronJobsService.name);

  constructor(
    @InjectQueue('reservation-jobs') private readonly reservationQueue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.registerRepeatableJobs();
  }

  private async registerRepeatableJobs(): Promise<void> {
    // Sweep paiements orphelins toutes les 30 min
    await this.reservationQueue.add(
      'orphan-payment',
      {},
      {
        repeat: { cron: '*/30 * * * *' },
        jobId: 'cron-orphan-payment',
        removeOnComplete: true,
        attempts: 3,
      },
    );

    // Recalcul des notes chaque nuit à 2h
    await this.reservationQueue.add(
      'reconcile-notes',
      {},
      {
        repeat: { cron: '0 2 * * *' },
        jobId: 'cron-reconcile-notes',
        removeOnComplete: true,
        attempts: 3,
      },
    );

    // Reset fautes > 12 mois — 1er de chaque mois à 3h
    await this.reservationQueue.add(
      'reset-compteurs',
      {},
      {
        repeat: { cron: '0 3 1 * *' },
        jobId: 'cron-reset-compteurs',
        removeOnComplete: true,
        attempts: 3,
      },
    );

    // Suppression des photos état des lieux > 15j après dateFin — chaque nuit à 4h
    await this.reservationQueue.add(
      'cleanup-etat-lieux-photos',
      {},
      {
        repeat: { cron: '0 4 * * *' },
        jobId: 'cron-cleanup-etat-lieux-photos',
        removeOnComplete: true,
        attempts: 3,
      },
    );

    this.logger.log('[CronJobs] Jobs répétables enregistrés (orphan-payment, reconcile-notes, reset-compteurs, cleanup-etat-lieux-photos)');
  }
}
