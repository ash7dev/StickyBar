import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AutoClotureUseCase } from '../../../domain/reservation/use-cases/auto-cloture.use-case';

@Processor('reservation-jobs')
export class AutoClotureJob {
  private readonly logger = new Logger(AutoClotureJob.name);

  constructor(private readonly autoClotureUseCase: AutoClotureUseCase) {}

  @Process('auto-cloture')
  async handle(job: Job<{ reservationId: string }>) {
    this.logger.log(`[JOB] auto-cloture : Traitement de la réservation ${job.data.reservationId}`);
    try {
      await this.autoClotureUseCase.execute(job.data.reservationId);
    } catch (error: any) {
      this.logger.error(`[JOB] auto-cloture : Erreur sur ${job.data.reservationId}`, error.stack);
      throw error;
    }
  }
}
