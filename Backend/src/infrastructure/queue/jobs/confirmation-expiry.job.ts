import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ExpireConfirmationUseCase } from '../../../domain/reservation/use-cases/expire-confirmation.use-case';

@Processor('reservation-jobs')
export class ConfirmationExpiryJob {
  private readonly logger = new Logger(ConfirmationExpiryJob.name);

  constructor(private readonly expireUseCase: ExpireConfirmationUseCase) {}

  @Process('expire-confirmation')
  async handle(job: Job<{ reservationId: string }>) {
    this.logger.log(`[expire-confirmation] Réservation ${job.data.reservationId}`);
    try {
      await this.expireUseCase.execute(job.data.reservationId);
    } catch (error: any) {
      this.logger.error(`[expire-confirmation] Erreur sur ${job.data.reservationId}`, error.stack);
      throw error;
    }
  }
}
