import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RecalculerNotesUseCase } from '../../../domain/reservation/use-cases/recalculer-notes.use-case';

@Processor('reservation-jobs')
export class ReconcileNotesJob {
  private readonly logger = new Logger(ReconcileNotesJob.name);

  constructor(private readonly recalculerNotes: RecalculerNotesUseCase) {}

  @Process('reconcile-notes')
  async handle(job: Job) {
    this.logger.log('[reconcile-notes] Recalcul notes agrégées');
    await this.recalculerNotes.execute();
  }
}
