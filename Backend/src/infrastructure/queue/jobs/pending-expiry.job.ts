import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ExpirePendingUseCase } from '../../../domain/reservation/use-cases/expire-pending.use-case';

@Processor('reservation-jobs')
export class PendingExpiryJob {
  private readonly logger = new Logger(PendingExpiryJob.name);

  constructor(private readonly expireUseCase: ExpirePendingUseCase) {}

  @Process('expire-pending')
  async handle(job: Job<{ reservationId: string }>) {
    this.logger.log(`[JOB] expire-pending : Traitement de la réservation ${job.data.reservationId}`);
    try {
      await this.expireUseCase.execute(job.data.reservationId);
    } catch (error: any) {
      this.logger.error(`[JOB] expire-pending : Erreur sur ${job.data.reservationId}`, error.stack);
      throw error;
    }
  }
}
