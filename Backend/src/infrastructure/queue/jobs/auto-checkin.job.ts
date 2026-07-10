import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AutoCheckinUseCase } from '../../../domain/reservation/use-cases/auto-checkin.use-case';

@Processor('reservation-jobs')
export class AutoCheckinJob {
  private readonly logger = new Logger(AutoCheckinJob.name);

  constructor(private readonly autoCheckinUseCase: AutoCheckinUseCase) {}

  @Process('auto-checkin')
  async handle(job: Job<{ reservationId: string }>) {
    const { reservationId } = job.data;
    this.logger.log(`[auto-checkin] Traitement réservation ${reservationId}`);

    try {
      await this.autoCheckinUseCase.execute(reservationId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(
        `[auto-checkin] Erreur pour ${reservationId}: ${error.message}`,
        error.stack,
      );
      throw error; // Bull ré-essaiera selon la config backoff
    }
  }
}
