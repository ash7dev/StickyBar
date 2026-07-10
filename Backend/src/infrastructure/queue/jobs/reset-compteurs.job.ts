import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ReinitialiserCompteursUseCase } from '../../../domain/fautes/use-cases/reinitialiser-compteurs.use-case';

@Processor('reservation-jobs')
export class ResetCompteursJob {
  private readonly logger = new Logger(ResetCompteursJob.name);

  constructor(private readonly reinitialiserCompteurs: ReinitialiserCompteursUseCase) {}

  @Process('reset-compteurs')
  async handle(job: Job) {
    this.logger.log('[reset-compteurs] Reset fautes > 12 mois');
    await this.reinitialiserCompteurs.execute();
  }
}
