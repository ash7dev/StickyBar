import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrphanPaymentUseCase } from '../../../domain/payment/use-cases/orphan-payment.use-case';

@Processor('reservation-jobs')
export class OrphanPaymentJob {
  private readonly logger = new Logger(OrphanPaymentJob.name);

  constructor(private readonly orphanPayment: OrphanPaymentUseCase) {}

  @Process('orphan-payment')
  async handle(job: Job) {
    this.logger.log('[orphan-payment] Sweep paiements orphelins');
    await this.orphanPayment.execute();
  }
}
