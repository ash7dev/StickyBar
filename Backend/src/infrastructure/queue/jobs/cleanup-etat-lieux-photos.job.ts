import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CleanupEtatLieuxPhotosUseCase } from '../../../domain/reservation/use-cases/cleanup-etat-lieux-photos.use-case';

@Processor('reservation-jobs')
export class CleanupEtatLieuxPhotosJob {
  private readonly logger = new Logger(CleanupEtatLieuxPhotosJob.name);

  constructor(private readonly cleanup: CleanupEtatLieuxPhotosUseCase) {}

  @Process('cleanup-etat-lieux-photos')
  async handle(job: Job) {
    this.logger.log('[cleanup-etat-lieux-photos] Nettoyage des photos état des lieux > 15j');
    await this.cleanup.execute();
  }
}
