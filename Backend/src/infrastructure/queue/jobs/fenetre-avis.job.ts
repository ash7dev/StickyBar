import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FermerFenetreAvisUseCase } from '../../../domain/reservation/use-cases/fermer-fenetre-avis.use-case';

@Processor('reservation-jobs')
export class FenetreAvisJob {
  private readonly logger = new Logger(FenetreAvisJob.name);

  constructor(private readonly fermerFenetreAvis: FermerFenetreAvisUseCase) {}

  @Process('fermer-fenetre-avis')
  async handle(job: Job<{ reservationId: string }>) {
    this.logger.log(`[fermer-fenetre-avis] → ${job.data.reservationId}`);
    await this.fermerFenetreAvis.execute(job.data.reservationId);
  }
}
