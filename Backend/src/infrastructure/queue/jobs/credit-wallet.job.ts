import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CreditWalletUseCase } from '../../../domain/wallet/use-cases/credit-wallet.use-case';

@Processor('reservation-jobs')
export class CreditWalletJob {
  private readonly logger = new Logger(CreditWalletJob.name);

  constructor(private readonly creditWallet: CreditWalletUseCase) {}

  @Process('credit-wallet')
  async handle(job: Job<{ reservationId: string }>) {
    const { reservationId } = job.data;
    this.logger.log(`[credit-wallet] Crédit wallet pour résa ${reservationId} (tentative ${job.attemptsMade + 1})`);
    await this.creditWallet.execute(reservationId);
  }
}
