import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RappelJourJUseCase } from '../../../domain/reservation/use-cases/rappel-jour-j.use-case';

// Job ajouté dans 'reservation-jobs' par QueueService.scheduleArrivalReminder
@Processor('reservation-jobs')
export class RappelJourJJob {
  private readonly logger = new Logger(RappelJourJJob.name);

  constructor(private readonly rappelJourJ: RappelJourJUseCase) {}

  @Process('rappel-jour-j')
  async handle(job: Job<{ reservationId: string }>) {
    this.logger.log(`[rappel-jour-j] Rappel J-1 → ${job.data.reservationId}`);
    await this.rappelJourJ.execute(job.data.reservationId);
  }
}
